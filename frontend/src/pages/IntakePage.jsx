import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import { INTAKE_SOURCES } from '../constants/constants';

export default function IntakePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdRepair, setCreatedRepair] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    newCustomerRef: false,
    newCustomerName: '',
    newCustomerPhone: '',
    newCustomerPhoneSecondary: '',
    newCustomerEmail: '',
    newCustomerIsCompany: false,
    newCustomerCompanyContactPerson: '',
    newCustomerPanNumber: '',
    newCustomerAddressLine: '',
    newCustomerCityDistrict: '',
    newCustomerNearestBranch: '',
    newCustomerLatitude: '',
    newCustomerLongitude: '',
    brand: '',
    modelName: '',
    serialNumber: '',
    serviceTypeId: '',
    intakeSource: INTAKE_SOURCES.WALK_IN,
    devicePasscode: '',
    intakeNotes: '',
    internalNotes: '',
    defaultServiceCharge: '',
  });
  const FRONTDESK_CHARGE = 100;

  useEffect(() => {
    // Fetch customers to populate the dropdown
    const loadCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomers(res.data.data || []);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    };
    const loadServiceTypes = async () => {
      try {
        const res = await api.get('/service-catalog');
        setServiceTypes((res.data || []).filter((s) => s.isActive !== false));
      } catch (err) {
        console.error('Failed to load service types', err);
      }
    };
    loadCustomers();
    loadServiceTypes();
  }, []);

  const selectedServiceType = serviceTypes.find((s) => s.id === formData.serviceTypeId);
  const selectedServiceCharge = Number(selectedServiceType?.defaultServiceCharge || 0);
  const manualServiceCharge = Number(formData.defaultServiceCharge || 0);
  const finalChargePreview = FRONTDESK_CHARGE + (selectedServiceType ? selectedServiceCharge : manualServiceCharge);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let finalCustomerId = formData.customerId;

      // 1. Create a new Customer if requested
      if (formData.newCustomerRef) {
        if (!formData.newCustomerName || !formData.newCustomerPhone) {
          throw new Error("Name and Phone are required for new customers.");
        }
        const createdCustomer = await api.post('/customers', {
          name: formData.newCustomerName,
          phonePrimary: formData.newCustomerPhone,
          phoneSecondary: formData.newCustomerPhoneSecondary || null,
          email: formData.newCustomerEmail || null,
          isCompany: formData.newCustomerIsCompany,
          companyContactPerson: formData.newCustomerCompanyContactPerson || null,
          panNumber: formData.newCustomerPanNumber || null,
          primaryAddress: {
            label: 'Primary',
            addressLine: formData.newCustomerAddressLine || null,
            cityDistrict: formData.newCustomerCityDistrict || null,
            nearestBranch: formData.newCustomerNearestBranch || null,
            latitude: formData.newCustomerLatitude ? Number(formData.newCustomerLatitude) : null,
            longitude: formData.newCustomerLongitude ? Number(formData.newCustomerLongitude) : null,
          },
        });
        finalCustomerId = createdCustomer.data.id;
      }

      if (!finalCustomerId) {
        throw new Error("Please select an existing customer or create a new one.");
      }

      // 2. Create the Intake Order
      const payload = {
        customerId: finalCustomerId,
        intakeSource: formData.intakeSource || INTAKE_SOURCES.WALK_IN,
        serviceTypeId: formData.serviceTypeId || null,
        device: {
          brand: formData.brand,
          modelName: formData.modelName,
          serialNumber: formData.serialNumber,
          devicePasscode: formData.devicePasscode
        },
        intakeNotes: formData.intakeNotes,
        internalNotes: formData.internalNotes || null,
        defaultServiceCharge: selectedServiceType ? selectedServiceCharge : (formData.defaultServiceCharge ? parseFloat(formData.defaultServiceCharge) : 0),
        accessoriesIncluded: [] // Optional
      };

      const res = await api.post('/repair-orders', payload);
      setCreatedRepair(res.data);

    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to create intake order.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold mb-1">New Industrial Work Order Intake</h1>
        <p className="text-secondary tracking-wide">Register an industrial asset/job, attach customer/company info, and initialize workflow.</p>
      </header>

      {error && (
        <div className="p-4 rounded-md border text-sm font-medium animate-fade-in flex items-center gap-3 badge-danger">
          <span className="material-symbols-rounded icon-md">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Customer Section */}
        <section className="card p-6 flex flex-col gap-5">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-panel pb-3 mb-1">
            <span className="material-symbols-rounded text-accent-primary">person</span>
            Customer Information
          </h2>

          <div className="flex items-center gap-3 mb-2 p-3 bg-surface border border-panel rounded-md">
            <input 
              type="checkbox" 
              id="newCustomerRef"
              name="newCustomerRef"
              checked={formData.newCustomerRef}
              onChange={handleChange}
              className="w-4 h-4 rounded border-panel text-accent-primary focus:ring-accent-primary"
            />
            <label htmlFor="newCustomerRef" className="text-sm font-semibold select-none cursor-pointer">
              Register a new customer/company
            </label>
          </div>

          {!formData.newCustomerRef ? (
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Select Existing Customer</label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-3.5 text-muted icon-sm">search</span>
                <select 
                  name="customerId" 
                  value={formData.customerId} 
                  onChange={handleChange} 
                  required={!formData.newCustomerRef}
                  className="pl-10 appearance-none bg-primary"
                >
                  <option value="">-- Search & Select --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phonePrimary || c.phoneSecondary || 'No Phone'})</option>
                  ))}
                </select>
                <span className="material-symbols-rounded absolute right-3 top-3.5 text-muted pointer-events-none icon-sm">expand_more</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 animate-fade-in p-4 border border-dashed border-panel bg-primary rounded-md">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Customer / Company Name *</label>
                <input type="text" name="newCustomerName" value={formData.newCustomerName} onChange={handleChange} required placeholder="Jane Doe" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Phone Number *</label>
                <input type="tel" name="newCustomerPhone" value={formData.newCustomerPhone} onChange={handleChange} required placeholder="(555) 123-4567" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Secondary Phone</label>
                <input type="tel" name="newCustomerPhoneSecondary" value={formData.newCustomerPhoneSecondary} onChange={handleChange} placeholder="Optional" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Email Address (Optional)</label>
                <input type="email" name="newCustomerEmail" value={formData.newCustomerEmail} onChange={handleChange} placeholder="jane.doe@email.com" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Address</label>
                <textarea name="newCustomerAddressLine" value={formData.newCustomerAddressLine} onChange={handleChange} rows={2} placeholder="Street, area, landmark..." />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">City / District</label>
                <input type="text" name="newCustomerCityDistrict" value={formData.newCustomerCityDistrict} onChange={handleChange} placeholder="City/District" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Nearest Branch</label>
                <input type="text" name="newCustomerNearestBranch" value={formData.newCustomerNearestBranch} onChange={handleChange} placeholder="Nearest service branch" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Latitude</label>
                <input type="number" step="0.00000001" name="newCustomerLatitude" value={formData.newCustomerLatitude} onChange={handleChange} placeholder="e.g. 12.9715987" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Longitude</label>
                <input type="number" step="0.00000001" name="newCustomerLongitude" value={formData.newCustomerLongitude} onChange={handleChange} placeholder="e.g. 77.5945660" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="newCustomerIsCompany" name="newCustomerIsCompany" checked={formData.newCustomerIsCompany} onChange={handleChange} />
                <label htmlFor="newCustomerIsCompany" className="text-sm">This intake is for a company account</label>
              </div>
              {formData.newCustomerIsCompany && (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Company Contact Person</label>
                    <input type="text" name="newCustomerCompanyContactPerson" value={formData.newCustomerCompanyContactPerson} onChange={handleChange} placeholder="Contact person name" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">PAN / Tax ID</label>
                    <input type="text" name="newCustomerPanNumber" value={formData.newCustomerPanNumber} onChange={handleChange} placeholder="PAN number" />
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Device Information */}
        <section className="card p-6 flex flex-col gap-5">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-panel pb-3 mb-1">
            <span className="material-symbols-rounded text-accent-secondary">devices</span>
            Device Details
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Machine / Asset OEM *</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleChange} required placeholder="e.g. Siemens, ABB, Schneider" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Intake Source</label>
              <select name="intakeSource" value={formData.intakeSource} onChange={handleChange}>
                <option value={INTAKE_SOURCES.WALK_IN}>Walk In</option>
                <option value={INTAKE_SOURCES.PHONE}>Phone</option>
                <option value={INTAKE_SOURCES.WHATSAPP}>WhatsApp</option>
                <option value={INTAKE_SOURCES.WEBSITE}>Website</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Service Category</label>
              <select name="serviceTypeId" value={formData.serviceTypeId} onChange={handleChange}>
                <option value="">-- Select Service Category --</option>
                {serviceTypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.defaultServiceCharge ? ` (₹${Number(s.defaultServiceCharge).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Model / Asset Type *</label>
              <input type="text" name="modelName" value={formData.modelName} onChange={handleChange} required placeholder="e.g. VFD, PLC, Servo Drive" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Serial/IMEI Number (Optional)</label>
              <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="Enter identifier" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Device Passcode (Optional)</label>
              <input type="text" name="devicePasscode" value={formData.devicePasscode} onChange={handleChange} placeholder="PIN or Pattern description" />
            </div>
          </div>

          <div className="mt-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Failure Report / Intake Notes *</label>
            <textarea 
              name="intakeNotes" 
              value={formData.intakeNotes} 
              onChange={handleChange} 
              required 
              rows={4}
              placeholder="Describe symptom, downtime impact, and observed fault condition..."
              className="resize-y"
            />
          </div>
          <div className="mt-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Internal Workshop Notes</label>
            <textarea
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              rows={3}
              placeholder="Technician-only notes for parts risk, urgency, or safety checks..."
              className="resize-y"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Service Charge (Optional)</label>
            <div className="relative w-1/2">
              <span className="absolute left-3 top-3 text-muted font-bold">₹</span>
              <input 
                type="number" 
                step="0.01"
                min="0"
                name="defaultServiceCharge" 
                value={formData.defaultServiceCharge} 
                onChange={handleChange} 
                placeholder="0.00"
                className="pl-7"
                disabled={!!selectedServiceType}
              />
            </div>
            <p className="text-xs text-secondary mt-2">
              Final default charge preview = ₹{finalChargePreview.toFixed(2)} (Front Desk ₹{FRONTDESK_CHARGE} + {selectedServiceType ? 'Service Category Default' : 'Manual Service Charge'}).
            </p>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 pb-12 pt-4">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(APP_ROUTES.REPAIR_ORDERS_LIST)}>Cancel</button>
          <button type="submit" className="btn btn-primary px-8" disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="material-symbols-rounded icon-sm animate-spin">progress_activity</span> Processing...</>
            ) : (
              <><span className="material-symbols-rounded icon-sm">check_circle</span> Create Intake Order</>
            )}
          </button>
        </div>

      </form>

      {createdRepair && (
        <section className="card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Intake Created - QR Tracking Label</h2>
            <span className="badge badge-success">{createdRepair.ticketNumber}</span>
          </div>
          <p className="text-secondary text-sm">
            QR token generated for this work order: <span className="font-mono text-primary">{createdRepair.qrToken}</span>
          </p>
          <div className="bg-white p-3 rounded-md w-fit">
            <QRCodeSVG value={createdRepair.qrToken} size={180} level="M" />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
              Print Label
            </button>
            <button className="btn btn-primary" type="button" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(createdRepair.id))}>
              Open Repair Workspace
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
