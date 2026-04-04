import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import { INTAKE_SOURCES, INTAKE_SOURCE_LABELS } from '../constants/constants';
import { validatePhone, validateEmail } from '../utils/validation';
import deviceBrands from '../data/deviceBrands.json';
import QrLabelPrint, { printQrLabel } from '../components/QrLabelPrint';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LEN = 2;
const SEARCH_LIMIT = 10;

export default function IntakePage() {
  const navigate = useNavigate();
  const qrPrintRef = useRef(null);

  // Customer state
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [customerSearchDebounced, setCustomerSearchDebounced] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const customerSearchRef = useRef(null);

  // Brand autocomplete state
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandInputRef = useRef(null);

  // Custom select states
  const [intakeSourceOpen, setIntakeSourceOpen] = useState(false);
  const intakeSourceRef = useRef(null);
  const [serviceCategoryOpen, setServiceCategoryOpen] = useState(false);
  const serviceCategoryRef = useRef(null);

  // Service catalog state
  const [serviceTypes, setServiceTypes] = useState([]);

  // Form data
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerPhone2: '',
    customerEmail: '',
    customerAddressLine: '',
    customerCityDistrict: '',
    customerPlusCode: '',
    customerLogisticsCode: '',
    brand: '',
    modelName: '',
    serialNumber: '',
    devicePasscode: '',
    serviceTypeId: '',
    intakeSource: INTAKE_SOURCES.WALK_IN,
    intakeNotes: '',
    internalNotes: '',
    manualServiceCharge: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdRepair, setCreatedRepair] = useState(null);

  // ─── Load service catalog ───────────────────────────────────────────────
  useEffect(() => {
    api.get('/service-catalog')
      .then(res => setServiceTypes((res.data || []).filter(s => s.isActive !== false)))
      .catch(() => setServiceTypes([]));
  }, []);

  const selectedService = serviceTypes.find(s => s.id === form.serviceTypeId);
  const effectiveCharge = selectedService
    ? Number(selectedService.defaultServiceCharge || 0)
    : Number(form.manualServiceCharge || 0);

  // ─── Customer search debounce ───────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setCustomerSearchDebounced(customerSearchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [customerSearchInput]);

  useEffect(() => {
    if (customerSearchDebounced.length < SEARCH_MIN_LEN) {
      setCustomerSearchResults([]);
      return;
    }
    let cancelled = false;
    setCustomerSearchLoading(true);
    api.get('/customers', { params: { q: customerSearchDebounced, limit: SEARCH_LIMIT } })
      .then(res => { if (!cancelled) setCustomerSearchResults(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setCustomerSearchResults([]); })
      .finally(() => { if (!cancelled) setCustomerSearchLoading(false); });
    return () => { cancelled = true; };
  }, [customerSearchDebounced]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target)) setCustomerDropdownOpen(false);
      if (brandInputRef.current && !brandInputRef.current.contains(e.target)) setBrandDropdownOpen(false);
      if (intakeSourceRef.current && !intakeSourceRef.current.contains(e.target)) setIntakeSourceOpen(false);
      if (serviceCategoryRef.current && !serviceCategoryRef.current.contains(e.target)) setServiceCategoryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = useCallback((c) => {
    setForm(f => ({
      ...f,
      customerName: c.name || '',
      customerPhone: c.phonePrimary || c.phone || '',
      customerPhone2: c.phoneSecondary || c.phone2 || '',
      customerEmail: c.email || '',
      customerAddressLine: c.addresses?.[0]?.addressLine || c.address || '',
      customerCityDistrict: c.addresses?.[0]?.cityDistrict || '',
      customerPlusCode: c.addresses?.[0]?.googleMapsPin || '',
      customerLogisticsCode: c.addresses?.[0]?.logisticsCode || '',
    }));
    setSelectedCustomerId(c.id);
    setCustomerSearchInput('');
    setCustomerSearchResults([]);
    setCustomerDropdownOpen(false);
  }, []);

  // ─── Field change handlers ──────────────────────────────────────────────
  const update = (field) => (e) => {
    const v = e.target.value;
    if ((field === 'customerPhone' || field === 'customerPhone2') && v !== '' && !/^\d*$/.test(v)) return;
    setForm(f => ({ ...f, [field]: v }));
    // Reset existing-customer binding if manually editing contact fields
    if (['customerName', 'customerPhone', 'customerPhone2', 'customerEmail'].includes(field)) {
      setSelectedCustomerId(null);
    }
    setFieldErrors(errs => ({ ...errs, [field]: undefined }));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedCustomerId) {
      if (!form.customerName.trim()) errors.customerName = 'Full name is required.';
      const phoneResult = validatePhone(form.customerPhone);
      if (!phoneResult.valid) errors.customerPhone = phoneResult.message;
      if (form.customerPhone2) {
        const p2 = validatePhone(form.customerPhone2);
        if (!p2.valid) errors.customerPhone2 = p2.message;
      }
      const emailResult = validateEmail(form.customerEmail);
      if (!emailResult.valid) errors.customerEmail = emailResult.message;
    }

    if (!form.brand.trim()) errors.brand = 'Brand / OEM is required.';
    if (!form.modelName.trim()) errors.modelName = 'Model is required.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setError('');
    setCreatedRepair(null);

    try {
      let finalCustomerId = selectedCustomerId;

      // Create new customer if not picking existing
      if (!finalCustomerId) {
        const customerRes = await api.post('/customers', {
          name: form.customerName.trim(),
          phonePrimary: form.customerPhone,
          phoneSecondary: form.customerPhone2 || null,
          email: form.customerEmail || null,
          primaryAddress: (form.customerAddressLine || form.customerCityDistrict || form.customerPlusCode || form.customerLogisticsCode) ? {
            label: 'Primary',
            addressLine: form.customerAddressLine || null,
            cityDistrict: form.customerCityDistrict || null,
            plusCode: form.customerPlusCode || null,
            logisticsCode: form.customerLogisticsCode || null,
          } : undefined,
        });
        finalCustomerId = customerRes.data.id;
      }

      const repairRes = await api.post('/repair-orders', {
        customerId: finalCustomerId,
        intakeSource: form.intakeSource,
        serviceTypeId: form.serviceTypeId || null,
        device: {
          brand: form.brand.trim(),
          modelName: form.modelName.trim(),
          serialNumber: form.serialNumber || null,
          devicePasscode: form.devicePasscode || null,
        },
        intakeNotes: form.intakeNotes || null,
        internalNotes: form.internalNotes || null,
        defaultServiceCharge: effectiveCharge || 0,
      });

      setCreatedRepair(repairRes.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create intake. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreatedRepair(null);
    setForm({
      customerName: '', customerPhone: '', customerPhone2: '', customerEmail: '',
      customerAddressLine: '', customerCityDistrict: '', customerPlusCode: '', customerLogisticsCode: '',
      brand: '', modelName: '', serialNumber: '', devicePasscode: '',
      serviceTypeId: '', intakeSource: INTAKE_SOURCES.WALK_IN,
      intakeNotes: '', internalNotes: '', manualServiceCharge: '',
    });
    setSelectedCustomerId(null);
    setFieldErrors({});
    setError('');
  };

  const filteredBrands = deviceBrands.filter(b =>
    !form.brand || b.toLowerCase().includes(form.brand.toLowerCase())
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <header>
        <h1 className="text-3xl font-extrabold mb-1">New Repair Intake</h1>
        <p className="text-secondary">Register a device for service and assign it to a customer.</p>
      </header>

      {/* Success card */}
      {createdRepair && (
        <section className="card p-6 flex flex-col gap-4 border-l-4" style={{ borderColor: 'var(--accent-secondary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-rounded text-accent-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <h2 className="text-lg font-bold">Intake Created Successfully</h2>
              </div>
              <p className="text-secondary text-sm">
                Ticket <span className="font-mono font-bold text-primary">{createdRepair.ticketNumber}</span> for{' '}
                <span className="font-semibold text-primary">{createdRepair.customer?.name}</span>
              </p>
            </div>
            <span className="badge badge-success">{createdRepair.status}</span>
          </div>

          <div className="flex gap-6 items-start flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-lg shadow">
                <QRCodeSVG value={createdRepair.ticketNumber} size={140} level="M" />
              </div>
              <span className="font-mono text-xs text-muted">{createdRepair.ticketNumber}</span>
              <button className="btn btn-secondary text-xs" onClick={() => printQrLabel(qrPrintRef, {})}>
                <span className="material-symbols-rounded icon-sm">print</span> Print Label
              </button>
            </div>
            
            {/* Hidden actual label structure used for to-data-url thermal printing */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
               <QrLabelPrint 
                 ref={qrPrintRef} 
                 customerName={customer?.fullName || ''} 
                 qrToken={createdRepair.ticketNumber} 
               />
            </div>
            <div className="flex flex-col gap-2 text-sm flex-1">
              <p className="text-muted text-xs uppercase font-bold tracking-wider">Device</p>
              <p className="font-semibold">{createdRepair.device?.brand} {createdRepair.device?.modelName}</p>
              {createdRepair.device?.serialNumber && <p className="text-secondary">S/N: {createdRepair.device.serialNumber}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                <button className="btn btn-primary" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(createdRepair.id))}>
                  <span className="material-symbols-rounded icon-sm">open_in_new</span> Open Workspace
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>
                  <span className="material-symbols-rounded icon-sm">add</span> New Intake
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-md border text-sm font-medium animate-fade-in flex items-center gap-3 badge-danger">
          <span className="material-symbols-rounded icon-md">error</span>
          {error}
        </div>
      )}

      {!createdRepair && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Customer Section ──────────────────────────────────── */}
          <section className="card p-6 flex flex-col gap-5">
            <h2 className="text-base font-bold flex items-center gap-2 border-b border-panel pb-3">
              <span className="material-symbols-rounded text-accent-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              Customer Information
            </h2>

            {/* Customer live search */}
            <div ref={customerSearchRef} style={{ position: 'relative' }}>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                Search Existing Customer
              </label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-3 text-muted icon-sm">search</span>
                <input
                  type="text"
                  placeholder="Type name or phone to search..."
                  value={customerSearchInput}
                  onChange={e => { setCustomerSearchInput(e.target.value); setCustomerDropdownOpen(true); }}
                  onFocus={() => customerSearchResults.length > 0 && setCustomerDropdownOpen(true)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
              {selectedCustomerId && (
                <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--accent-secondary)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Using existing customer record —{' '}
                  <button type="button" className="underline" onClick={() => { setSelectedCustomerId(null); }}>clear</button>
                </div>
              )}
              {customerDropdownOpen && customerSearchInput.trim().length >= SEARCH_MIN_LEN && customerSearchResults.length > 0 && (
                <ul className="dropdown-menu">
                  {customerSearchLoading && (
                    <li className="px-4 py-3 text-sm text-muted flex items-center gap-2">
                      <span className="material-symbols-rounded icon-sm animate-spin">progress_activity</span> Searching...
                    </li>
                  )}
                  {!customerSearchLoading && customerSearchResults.length === 0 && (
                    <li className="px-4 py-3 text-sm text-muted">No matching customer found</li>
                  )}
                  {!customerSearchLoading && customerSearchResults.map(c => (
                    <li key={c.id}
                      role="button" tabIndex={0}
                      onClick={() => selectCustomer(c)}
                      onKeyDown={ev => ev.key === 'Enter' && selectCustomer(c)}
                    >
                      <div className="font-semibold text-sm text-primary">{c.name}</div>
                      <div className="text-xs text-muted">{[c.phonePrimary, c.phoneSecondary, c.email].filter(Boolean).join(' · ') || '—'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Customer fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                  Full Name {!selectedCustomerId && '*'}
                </label>
                <input
                  type="text" value={form.customerName} onChange={update('customerName')}
                  placeholder="e.g. Ram Kumar Shrestha"
                  style={{ borderColor: fieldErrors.customerName ? '#f87171' : undefined }}
                />
                {fieldErrors.customerName && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.customerName}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                  Primary Phone {!selectedCustomerId && '*'}
                </label>
                <input
                  type="tel" inputMode="numeric" maxLength={10}
                  value={form.customerPhone} onChange={update('customerPhone')}
                  placeholder="98XXXXXXXX"
                  style={{ borderColor: fieldErrors.customerPhone ? '#f87171' : undefined }}
                />
                {fieldErrors.customerPhone && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.customerPhone}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Secondary Phone</label>
                <input
                  type="tel" inputMode="numeric" maxLength={10}
                  value={form.customerPhone2} onChange={update('customerPhone2')}
                  placeholder="Optional alternate number"
                  style={{ borderColor: fieldErrors.customerPhone2 ? '#f87171' : undefined }}
                />
                {fieldErrors.customerPhone2 && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.customerPhone2}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Email Address</label>
                <input
                  type="email" value={form.customerEmail} onChange={update('customerEmail')}
                  placeholder="Optional"
                  style={{ borderColor: fieldErrors.customerEmail ? '#f87171' : undefined }}
                />
                {fieldErrors.customerEmail && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.customerEmail}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Street / Address</label>
                <input type="text" value={form.customerAddressLine} onChange={update('customerAddressLine')} placeholder="Street, area, landmark" />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">City / District</label>
                <input type="text" value={form.customerCityDistrict} onChange={update('customerCityDistrict')} placeholder="e.g. Kathmandu" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pin_drop</span>
                  Plus Code / Google Maps Pin
                </label>
                <input
                  type="url" value={form.customerPlusCode} onChange={update('customerPlusCode')}
                  placeholder="https://maps.app.goo.gl/... or Plus Code (e.g. 7JCW+2C Kathmandu)"
                />
                <p className="text-xs text-muted mt-1">Paste a shared Google Maps link or Plus Code to save the customer's exact location.</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                  Logistics Code
                </label>
                <input
                  type="text" value={form.customerLogisticsCode} onChange={update('customerLogisticsCode')}
                  placeholder="e.g. KTM-07, PKR-12 (internal dispatch code)"
                />
                <p className="text-xs text-muted mt-1">Short code used by logistics staff for dispatch assignment.</p>
              </div>
            </div>
          </section>

          {/* ── Device Section ────────────────────────────────────── */}
          <section className="card p-6 flex flex-col gap-5">
            <h2 className="text-base font-bold flex items-center gap-2 border-b border-panel pb-3">
              <span className="material-symbols-rounded text-accent-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>electrical_services</span>
              Device  / Asset Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand autocomplete */}
              <div ref={brandInputRef} style={{ position: 'relative' }}>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Brand / OEM *</label>
                <input
                  type="text" value={form.brand}
                  onChange={update('brand')}
                  onFocus={() => setBrandDropdownOpen(true)}
                  placeholder="Select or type brand"
                  autoComplete="off"
                  style={{ borderColor: fieldErrors.brand ? '#f87171' : undefined }}
                />
                {fieldErrors.brand && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.brand}</p>}
                {brandDropdownOpen && (
                  <ul className="dropdown-menu">
                    {filteredBrands.map(b => (
                      <li key={b} role="button" tabIndex={0}
                        onClick={() => { setForm(f => ({ ...f, brand: b })); setBrandDropdownOpen(false); }}
                        onKeyDown={ev => ev.key === 'Enter' && (setForm(f => ({ ...f, brand: b })), setBrandDropdownOpen(false))}
                      >{b}</li>
                    ))}
                    <li role="button" tabIndex={0}
                      className="dropdown-item-muted"
                      onClick={() => { setForm(f => ({ ...f, brand: form.brand })); setBrandDropdownOpen(false); }}
                    >Others / Custom</li>
                  </ul>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Model / Asset Type *</label>
                <input
                  type="text" value={form.modelName} onChange={update('modelName')}
                  placeholder="e.g. ATV320 VFD, Inverter AC, Washing Machine"
                  style={{ borderColor: fieldErrors.modelName ? '#f87171' : undefined }}
                />
                {fieldErrors.modelName && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.modelName}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Serial Number </label>
                <input type="text" value={form.serialNumber} onChange={update('serialNumber')} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Access Code / Config PIN</label>
                <input type="text" value={form.devicePasscode} onChange={update('devicePasscode')} placeholder="Optional — control panel code for reference" />
              </div>
              <div ref={intakeSourceRef} style={{ position: 'relative' }}>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Intake Source</label>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--panel-border)',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                    borderColor: intakeSourceOpen ? 'var(--accent-primary)' : undefined,
                    boxShadow: intakeSourceOpen ? '0 0 0 3px rgba(0, 174, 239, 0.15)' : undefined
                  }}
                  onClick={() => setIntakeSourceOpen(prev => !prev)}
                >
                  <span className={form.intakeSource ? 'text-primary' : 'text-muted'}>
                    {INTAKE_SOURCE_LABELS[form.intakeSource] || form.intakeSource || 'Select source'}
                  </span>
                  <span className="material-symbols-rounded text-muted" style={{ fontSize: '20px' }}>expand_more</span>
                </div>
                {intakeSourceOpen && (
                  <ul className="dropdown-menu">
                    {Object.entries(INTAKE_SOURCE_LABELS).map(([val, label]) => (
                      <li key={val}
                        role="button" tabIndex={0}
                        onClick={() => { setForm(f => ({ ...f, intakeSource: val })); setIntakeSourceOpen(false); }}
                        onKeyDown={ev => ev.key === 'Enter' && (setForm(f => ({ ...f, intakeSource: val })), setIntakeSourceOpen(false))}
                      >{label}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div ref={serviceCategoryRef} style={{ position: 'relative' }}>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Service Category</label>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--panel-border)',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                    borderColor: serviceCategoryOpen ? 'var(--accent-primary)' : undefined,
                    boxShadow: serviceCategoryOpen ? '0 0 0 3px rgba(0, 174, 239, 0.15)' : undefined
                  }}
                  onClick={() => setServiceCategoryOpen(prev => !prev)}
                >
                  <span className={form.serviceTypeId ? 'text-primary' : 'text-muted'}>
                    {form.serviceTypeId
                      ? (() => {
                          const s = serviceTypes.find(t => t.id === form.serviceTypeId);
                          return s ? `${s.name}${s.defaultServiceCharge ? ` (Rs. ${Number(s.defaultServiceCharge).toFixed(2)})` : ''}` : form.serviceTypeId;
                        })()
                      : '— Select category (optional) —'
                    }
                  </span>
                  <span className="material-symbols-rounded text-muted" style={{ fontSize: '20px' }}>expand_more</span>
                </div>
                {serviceCategoryOpen && (
                  <ul className="dropdown-menu">
                    <li
                      role="button" tabIndex={0} className="dropdown-item-muted"
                      onClick={() => { setForm(f => ({ ...f, serviceTypeId: '' })); setServiceCategoryOpen(false); }}
                      onKeyDown={ev => ev.key === 'Enter' && (setForm(f => ({ ...f, serviceTypeId: '' })), setServiceCategoryOpen(false))}
                    >— Select category (optional) —</li>
                    {serviceTypes.map(s => (
                      <li key={s.id}
                        role="button" tabIndex={0}
                        onClick={() => { setForm(f => ({ ...f, serviceTypeId: s.id })); setServiceCategoryOpen(false); }}
                        onKeyDown={ev => ev.key === 'Enter' && (setForm(f => ({ ...f, serviceTypeId: s.id })), setServiceCategoryOpen(false))}
                      >
                        {s.name}{s.defaultServiceCharge ? ` (Rs. ${Number(s.defaultServiceCharge).toFixed(2)})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Fault Report / Intake Notes *</label>
              <textarea
                value={form.intakeNotes} onChange={update('intakeNotes')} required rows={4}
                placeholder="Describe the fault, symptoms, error codes, last known state or downtime impact..."
                className="resize-y"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Internal Workshop Notes</label>
              <textarea
                value={form.internalNotes} onChange={update('internalNotes')} rows={2}
                placeholder="Internal notes: hazard warnings, parts availability, assigned technician, urgency..."
                className="resize-y"
              />
            </div>

            {/* Charge preview */}
            <div className="p-4 rounded-md bg-surface border border-panel text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted font-medium">Default Service Charge</span>
                {selectedService ? (
                  <span className="font-bold text-accent-primary">Rs. {effectiveCharge.toFixed(2)} <span className="text-muted font-normal text-xs">from {selectedService.name}</span></span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-xs">Rs.</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={form.manualServiceCharge} onChange={update('manualServiceCharge')}
                      placeholder="0.00" className="w-28 text-right"
                      style={{ padding: '4px 8px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Actions ───────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(APP_ROUTES.REPAIR_ORDERS_LIST)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="material-symbols-rounded icon-sm animate-spin">progress_activity</span> Creating...</>
              ) : (
                <><span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Create Intake</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
