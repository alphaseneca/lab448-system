import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import { validatePhone, validateEmail } from '../utils/validation';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import FormField from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { PERMISSIONS } from '../constants/constants';

const SORT_KEYS = {
  name: (a, b) => a.name.localeCompare(b.name),
  phone: (a, b) => (a.phonePrimary || '').localeCompare(b.phonePrimary || ''),
  date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [form, setForm] = useState({
    isCompany: false,
    name: '',
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    companyContactPerson: '',
    panNumber: '',
    addressLine: '',
    cityDistrict: '',
    plusCode: '',
    logisticsCode: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Name or Company Name is required';
    }

    if (!form.phonePrimary.trim()) {
      errors.phonePrimary = 'Primary phone is required';
    } else {
      const r = validatePhone(form.phonePrimary);
      if (!r.valid) errors.phonePrimary = r.message;
    }

    if (form.phoneSecondary) {
      const r = validatePhone(form.phoneSecondary);
      if (!r.valid) errors.phoneSecondary = r.message;
    }

    if (form.email) {
      const r = validateEmail(form.email);
      if (!r.valid) errors.email = r.message;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        isCompany: form.isCompany,
        name: form.name.trim(),
        phonePrimary: form.phonePrimary.trim(),
        phoneSecondary: form.phoneSecondary.trim() || null,
        email: form.email.trim() || null,
        companyContactPerson: form.isCompany ? form.companyContactPerson.trim() : null,
        panNumber: form.isCompany ? form.panNumber.trim() : null,
        addressLine: form.addressLine.trim() || null,
        cityDistrict: form.cityDistrict.trim() || null,
        plusCode: form.plusCode.trim() || null,
        logisticsCode: form.logisticsCode.trim() || null,
      };

      await api.post('/customers', payload);
      await fetchCustomers();
      setShowModal(false);
      setForm({
        isCompany: false,
        name: '',
        phonePrimary: '',
        phoneSecondary: '',
        email: '',
        companyContactPerson: '',
        panNumber: '',
        addressLine: '',
        cityDistrict: '',
        plusCode: '',
        logisticsCode: '',
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create customer record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (customer) => {
    navigate(APP_ROUTES.CUSTOMER_DETAILS(customer.id));
  };

  const filtered = customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phonePrimary && c.phonePrimary.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort(SORT_KEYS[sortBy]);

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full pb-12">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold mb-1">Customers Directory</h1>
          <p className="text-secondary tracking-wide">Browse accounts, contact info, and device history.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
          <input
            type="text"
            placeholder="Search by Name, Phone, Email..."
            className="pl-9 py-2 text-sm bg-surface border-panel"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end w-full md:w-auto">
          <div className="flex bg-surface rounded-xl p-1 border border-panel">
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'date' ? 'bg-secondary text-accent-primary shadow-lg' : 'text-muted hover:text-text-primary'
              }`}
            >
              Date Joined
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'name' ? 'bg-secondary text-accent-primary shadow-lg' : 'text-muted hover:text-text-primary'
              }`}
            >
              A-Z
            </button>
          </div>

          <button className="btn btn-ghost" onClick={fetchCustomers} title="Refresh">
            {loading ? (
              <span className="loading-spinner spinner-sm"></span>
            ) : (
              <span className="material-symbols-rounded icon-sm">refresh</span>
            )}
          </button>

          {hasPermission(PERMISSIONS.CUSTOMER_EDIT) && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <span className="material-symbols-rounded icon-sm">person_add</span> Register Customer
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Customer / Contact</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Primary Phone</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Email Address</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted flex items-center justify-center gap-2">
                    <span className="material-symbols-rounded animate-spin">progress_activity</span> Loading directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">
                    <span className="material-symbols-rounded text-4xl mb-2 opacity-50 block mx-auto w-fit">group</span>
                    <p>No customer profiles found.</p>
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-panel hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => handleRowClick(c)}
                >
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-secondary/20 text-accent-secondary flex items-center justify-center">
                      <span className="material-symbols-rounded icon-sm">{c.isCompany ? 'business' : 'person'}</span>
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{c.name}</div>
                      {c.isCompany && c.companyContactPerson && (
                        <div className="text-xs text-muted">CP: {c.companyContactPerson}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-text-primary">{c.phonePrimary}</td>
                  <td className="py-4 px-6 text-muted">{c.email || 'N/A'}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                        c.isCompany
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                      }`}
                    >
                      {c.isCompany ? 'Company' : 'Individual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader title="Register New Customer" icon="person_add" onClose={() => setShowModal(false)} />
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg flex items-start gap-2">
                <span className="material-symbols-rounded icon-sm mt-0.5">error</span>
                <div>{error}</div>
              </div>
            )}

            <div className="flex items-center gap-3 py-1">
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

            <FormField label={form.isCompany ? 'Company Name' : 'Full Name'} required error={fieldErrors.name}>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder={form.isCompany ? 'e.g. Himalayan Industries Pvt. Ltd.' : 'e.g. Ram Kumar Shrestha'}
                className="w-full"
                style={{ borderColor: fieldErrors.name ? '#f87171' : undefined }}
                required
              />
            </FormField>

            {form.isCompany && (
              <>
                <FormField label="Contact Person">
                  <input type="text" value={form.companyContactPerson} onChange={update('companyContactPerson')} placeholder="Primary point of contact" className="w-full" />
                </FormField>
                <FormField label="PAN / Tax ID">
                  <input type="text" value={form.panNumber} onChange={update('panNumber')} placeholder="Optional" className="w-full" />
                </FormField>
              </>
            )}

            <FormField label="Primary Phone" required error={fieldErrors.phonePrimary}>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={form.phonePrimary} onChange={update('phonePrimary')}
                placeholder="98XXXXXXXX"
                className="w-full"
                style={{ borderColor: fieldErrors.phonePrimary ? '#f87171' : undefined }}
                required
              />
            </FormField>

            <FormField label="Secondary Phone" error={fieldErrors.phoneSecondary}>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={form.phoneSecondary} onChange={update('phoneSecondary')}
                placeholder="Optional"
                className="w-full"
                style={{ borderColor: fieldErrors.phoneSecondary ? '#f87171' : undefined }}
              />
            </FormField>

            <FormField label="Email Address" error={fieldErrors.email}>
              <input
                type="email" value={form.email} onChange={update('email')}
                placeholder="Optional"
                className="w-full"
                style={{ borderColor: fieldErrors.email ? '#f87171' : undefined }}
              />
            </FormField>

            <FormField label="Street / Area">
              <input type="text" value={form.addressLine} onChange={update('addressLine')} placeholder="Street, locality, landmark" className="w-full" />
            </FormField>

            <FormField label="City / District">
              <input type="text" value={form.cityDistrict} onChange={update('cityDistrict')} placeholder="e.g. Kathmandu" className="w-full" />
            </FormField>

            <FormField label="Plus Code / Maps Pin">
              <input
                type="text"
                value={form.plusCode}
                onChange={update('plusCode')}
                placeholder="Plus Code or Map Link"
                className="w-full"
              />
            </FormField>

            <FormField label="Logistics Code">
              <input
                type="text"
                value={form.logisticsCode}
                onChange={update('logisticsCode')}
                placeholder="e.g. KTM-07"
                className="w-full"
              />
            </FormField>
          </ModalBody>

          <ModalFooter>
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? (
                <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
              ) : (
                <><span className="material-symbols-rounded icon-sm">person_add</span> Create Customer</>
              )}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
