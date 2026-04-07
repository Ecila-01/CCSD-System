import React, { useState } from 'react';
import axios from 'axios';

export default function AddServiceForm({ onSuccess }) {
  // 1. State for Basic Service Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // 2. State for the Dynamic Form Fields (The Blueprint)
  const [fields, setFields] = useState([]);

  // --- HELPER FUNCTIONS ---

  // Add a new blank field to the array
  const handleAddField = () => {
    setFields([
      ...fields, 
      { 
        name: '', // We can auto-generate this from the label later
        label: '', 
        type: 'text', 
        required: false, 
        section: 1, 
        options: [], 
        content: '' 
      }
    ]);
  };

  // Update a specific field's property based on its index
  const handleFieldChange = (index, key, value) => {
    const updatedFields = [...fields];
    
    // Special handling for the 'options' array (comma separated)
    if (key === 'options') {
      updatedFields[index][key] = value.split(',').map(opt => opt.trim());
    } else {
      updatedFields[index][key] = value;
    }
    
    // Auto-generate the 'name' (camelCase) from the 'label' so admins don't have to type it
    if (key === 'label') {
       updatedFields[index].name = value.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
         return index === 0 ? word.toLowerCase() : word.toUpperCase();
       }).replace(/\s+/g, '');
    }

    setFields(updatedFields);
  };

  // Remove a field from the array
  const handleRemoveField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  // Submit everything to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newServicePayload = {
      name,
      description,
      image,
      fields
    };

    try {
      // Assuming your backend route is POST /api/services
      await axios.post('/api/services', newServicePayload);
      alert('Service created successfully!');
      if (onSuccess) onSuccess(); // Callback to refresh your Services table
    } catch (error) {
      console.error("Error creating service:", error);
      alert('Failed to create service.');
    }
  };

  return (
    <div className="add-service-container p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Create New Service</h2>
      
      <form onSubmit={handleSubmit}>
        {/* --- PART 1: BASIC INFO --- */}
        <div className="basic-info mb-8 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-2">Service Details</h3>
          <input 
            className="w-full p-2 mb-2 border rounded" 
            placeholder="Service Name (e.g. COUNSELING)" 
            value={name} onChange={(e) => setName(e.target.value)} required 
          />
          <textarea 
            className="w-full p-2 mb-2 border rounded" 
            placeholder="Description" 
            value={description} onChange={(e) => setDescription(e.target.value)} required 
          />
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Image URL (e.g. http://localhost:5000/uploads/icon.png)" 
            value={image} onChange={(e) => setImage(e.target.value)} 
          />
        </div>

        {/* --- PART 2: DYNAMIC FORM BUILDER --- */}
        <div className="form-builder mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Custom Form Fields</h3>
            <button type="button" onClick={handleAddField} className="bg-red-500 text-white px-4 py-2 rounded">
              + Add Field
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={index} className="field-box p-4 mb-4 border-l-4 border-red-500 bg-white shadow-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Field #{index + 1}</span>
                <button type="button" onClick={() => handleRemoveField(index)} className="text-red-500 text-sm">Remove</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Field Label */}
                <input 
                  className="p-2 border rounded" placeholder="Question Label (e.g. Age)"
                  value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} required
                />
                
                {/* Field Type */}
                <select 
                  className="p-2 border rounded"
                  value={field.type} onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Paragraph (Textarea)</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown (Select)</option>
                  <option value="info">Info Text Block</option>
                </select>

                {/* Section Number */}
                <input 
                  type="number" className="p-2 border rounded" placeholder="Page/Section Number"
                  value={field.section} onChange={(e) => handleFieldChange(index, 'section', Number(e.target.value))} required
                />

                {/* Required Checkbox */}
                <label className="flex items-center gap-2 p-2">
                  <input 
                    type="checkbox" 
                    checked={field.required} onChange={(e) => handleFieldChange(index, 'required', e.target.checked)} 
                  />
                  Is this field required?
                </label>
              </div>

              {/* CONDITIONAL INPUTS: Only show Options if type is 'select' */}
              {field.type === 'select' && (
                <input 
                  className="w-full p-2 border rounded border-blue-300 bg-blue-50"
                  placeholder="Type options separated by commas (e.g. First Year, Second Year, Third Year)"
                  value={field.options.join(', ')} 
                  onChange={(e) => handleFieldChange(index, 'options', e.target.value)} 
                />
              )}

              {/* CONDITIONAL INPUTS: Only show Content if type is 'info' */}
              {field.type === 'info' && (
                <textarea 
                  className="w-full p-2 border rounded border-yellow-300 bg-yellow-50"
                  placeholder="Type the instructional text or information here..."
                  value={field.content} 
                  onChange={(e) => handleFieldChange(index, 'content', e.target.value)} 
                />
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700">
          Save Service & Form
        </button>
      </form>
    </div>
  );
}