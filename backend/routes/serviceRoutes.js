const express = require('express');
const router = express.Router();
const Service = require('../models/Service');


router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', async (req, res) => {
  const service = new Service({
    name: req.body.name,  
    description: req.body.description, 
    status: "Inactive",
    image: req.body.image,
    fields: req.body.fields  
  });

  try {
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// DELETE a service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update only specific fields (like Status)
router.patch('/:id', async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, // This allows us to send { status: "Inactive" }
      { new: true }
    );
    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
module.exports = router;