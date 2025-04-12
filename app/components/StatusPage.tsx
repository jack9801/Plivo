import React, { useEffect, useState } from 'react';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  description?: string;
}

const ServiceStatusCard: React.FC<{
  service: ServiceStatus;
  onUpdate: (service: ServiceStatus) => void;
  onDelete: (id: string) => void;
}> = ({ service, onUpdate, onDelete }) => {
  const statusOptions = ['OPERATIONAL', 'DEGRADED', 'OUTAGE'];
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: service.name,
    description: service.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...service,
      ...editForm,
    });
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Service Name"
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Service Description"
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
              {service.description && (
                <p className="mt-1 text-sm text-gray-600">{service.description}</p>
              )}
            </>
          )}
          <div className="mt-1 text-xs text-gray-500">
            ID: {service.id}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <select
            value={service.status}
            onChange={(e) => onUpdate({ ...service, status: e.target.value as 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' })}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              service.status === 'OPERATIONAL' ? 'bg-green-100 text-green-800' :
              service.status === 'DEGRADED' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddServiceForm: React.FC<{
  onSubmit: (service: Omit<ServiceStatus, 'id'>) => void;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'OPERATIONAL' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      status: 'OPERATIONAL',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Service</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="OPERATIONAL">Operational</option>
            <option value="DEGRADED">Degraded</option>
            <option value="OUTAGE">Outage</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add Service
        </button>
      </div>
    </form>
  );
};

const StatusPage: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
      setError(null);
    } catch (err) {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (updatedService: ServiceStatus) => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedService),
      });

      if (!response.ok) throw new Error('Failed to update service');
      await fetchServices();
    } catch (err) {
      setError('Failed to update service');
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete service');
      await fetchServices();
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  const addService = async (newService: Omit<ServiceStatus, 'id'>) => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });

      if (!response.ok) throw new Error('Failed to add service');
      await fetchServices();
    } catch (err) {
      setError('Failed to add service');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p>Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Page</h1>
      <h2 className="text-lg text-gray-600 mb-6">Current Service Status</h2>
      
      <AddServiceForm onSubmit={addService} />
      
      {services.length === 0 ? (
        <p className="text-gray-600">No services available.</p>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceStatusCard
              key={service.id}
              service={service}
              onUpdate={updateService}
              onDelete={deleteService}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusPage; 