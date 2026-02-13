const Trajet = require('../models/Trajet');

exports.createTrajet = async (req, res) => {
  try {
    const trajet = new Trajet({ ...req.body, conducteur: req.user._id });
    await trajet.save();
    res.status(201).json(trajet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRetard = async (req, res) => {
  try {
    const { retard } = req.body;
    const trajet = await Trajet.findOneAndUpdate(
      { _id: req.params.id, conducteur: req.user._id },
      { retard },
      { new: true }
    );
    if (!trajet) return res.status(404).json({ message: 'Trajet non trouvé' });
    res.json(trajet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
