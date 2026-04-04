import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import { validatePhone, validateEmail } from '../utils/validation';

export default function NewCustomerPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    addressLine: '',
    cityDistrict: '',
    plusCode: '',
    logisticsCode: '',
    isCompany: false,
    companyContactPerson: '',
    panNumber: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: v }));
    setFieldErrors(errs => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name or company name is required.';
    const phoneValid = validatePhone(form.phonePrimary);
    if (!phoneValid.valid) errors.phonePrimary = phoneValid.message;
    if (form.phoneSecondary) {
      const p2 = validatePhone(form.phoneSecondary);
      if (!p2.valid) errors.phoneSecondary = p2.message;
    }
    const emailValid = validateEmail(form.email);
    if (!emailValid.valid) errors.email = emailValid.message;

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/customers', {
        name: form.name.trim(),
        phonePrimary: form.phonePrimary,
        phoneSecondary: form.phoneSecondary || null,
        email: form.email || null,
        isCompany: form.isCompany,
        companyContactPerson: form.companyContactPerson || null,
        panNumber: form.panNumber || null,
        primaryAddress: (form.addressLine || form.cityDistrict || form.plusCode || form.logisticsCode) ? {
          label: 'Primary',
          addressLine: form.addressLine || null,
          cityDistrict: form.cityDistrict || null,
          plusCode: form.plusCode || null,
          logisticsCode: form.logisticsCode || null,
        } : undefined,
      });
      navigate(APP_ROUTES.CUSTOMER_DETAILS(res.data.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">New Customer</h1>
          <p className="text-secondary">Register a new customer or company account.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(APP_ROUTES.CUSTOMERS)}>
          <span className="material-symbols-rounded icon-sm">arrow_back</span> Back
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-md badge-danger text-sm flex items-center gap-3">
          <span className="material-symbols-rounded icon-md">error</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Identity */}
        <section className="card p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary border-b border-panel pb-3 flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            Identity
          </h2>

          <div className="flex items-center gap-3">
            <input
              id="isCompany"
              type="checkbox"
              checked={form.isCompany}
              onChange={update('isCompany')}
              className="w-4 h-4"
            />
            <label htmlFor="isCompany" className="text-sm font-medium cursor-pointer">
              This is a company / organisation account
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                {form.isCompany ? 'Company Name' : 'Full Name'} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder={form.isCompany ? 'e.g. Himalayan Industries Pvt. Ltd.' : 'e.g. Ram Kumar Shrestha'}
                style={{ borderColor: fieldErrors.name ? '#f87171' : undefined }}
              />
              {fieldErrors.name && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.name}</p>}
            </div>

            {form.isCompany && (
              <>
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Contact Person</label>
                  <input type="text" value={form.companyContactPerson} onChange={update('companyContactPerson')} placeholder="Primary point of contact" />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">PAN / Tax ID</label>
                  <input type="text" value={form.panNumber} onChange={update('panNumber')} placeholder="Optional" />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Contact */}
        <section className="card p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary border-b border-panel pb-3 flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            Contact Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Primary Phone *</label>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={form.phonePrimary} onChange={update('phonePrimary')}
                placeholder="98XXXXXXXX"
                style={{ borderColor: fieldErrors.phonePrimary ? '#f87171' : undefined }}
              />
              {fieldErrors.phonePrimary && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.phonePrimary}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Secondary Phone</label>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={form.phoneSecondary} onChange={update('phoneSecondary')}
                placeholder="Optional"
                style={{ borderColor: fieldErrors.phoneSecondary ? '#f87171' : undefined }}
              />
              {fieldErrors.phoneSecondary && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.phoneSecondary}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Email Address</label>
              <input
                type="email" value={form.email} onChange={update('email')}
                placeholder="Optional"
                style={{ borderColor: fieldErrors.email ? '#f87171' : undefined }}
              />
              {fieldErrors.email && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fieldErrors.email}</p>}
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="card p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary border-b border-panel pb-3 flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            Address <span className="text-muted font-normal normal-case tracking-normal">(optional)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Street / Area</label>
              <input type="text" value={form.addressLine} onChange={update('addressLine')} placeholder="Street, locality, landmark" />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">City / District</label>
              <input type="text" value={form.cityDistrict} onChange={update('cityDistrict')} placeholder="e.g. Kathmandu" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex items-center gap-2">
                <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pin_drop</span>
                Plus Code / Google Maps Pin
              </label>
              <input
                type="url"
                value={form.plusCode}
                onChange={update('plusCode')}
                placeholder="https://maps.app.goo.gl/... or Plus Code (e.g. 7JCW+2C Kathmandu)"
              />
              <p className="text-xs text-muted mt-1">Share a Google Maps pin link or Plus Code to mark the exact location.</p>
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex items-center gap-2">
                <span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                Logistics Code
              </label>
              <input
                type="text"
                value={form.logisticsCode}
                onChange={update('logisticsCode')}
                placeholder="e.g. KTM-07, PKR-12 (internal dispatch identifier)"
              />
              <p className="text-xs text-muted mt-1">Short code used by logistics staff for dispatch assignment.</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(APP_ROUTES.CUSTOMERS)}>Cancel</button>
          <button type="submit" className="btn btn-primary px-8" disabled={submitting}>
            {submitting
              ? <><span className="material-symbols-rounded icon-sm animate-spin">progress_activity</span> Saving...</>
              : <><span className="material-symbols-rounded icon-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span> Create Customer</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
