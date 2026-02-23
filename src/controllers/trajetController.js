const Trajet = require("../models/Trajet");

exports.createTrajet = async (req, res) => {
  try {
    const trajet = new Trajet({ ...req.body, conducteur: req.user.id });
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
      { _id: req.params.id, conducteur: req.user.id },
      { retard },
      { new: true },
    );
    if (!trajet) return res.status(404).json({ message: "Trajet non trouvé" });
    res.json(trajet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTrajets = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const query = {};
    if (statut) query.statut = statut;

    const trajets = await Trajet.find(query)
      .populate("conducteur", "nom prenom photo note_moyenne")
      .populate("vehicule")
      .sort({ date_depart: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ count: trajets.length, trajets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrajetById = async (req, res) => {
  try {
    const trajet = await Trajet.findById(req.params.id)
      .populate("conducteur", "nom prenom photo telephone note_moyenne")
      .populate("vehicule");

    if (!trajet) return res.status(404).json({ message: "Trajet non trouvé" });

    res.json(trajet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTrajet = async (req, res) => {
  try {
    const trajet = await Trajet.findById(req.params.id);

    if (!trajet) return res.status(404).json({ message: "Trajet non trouvé" });
    if (trajet.conducteur.toString() !== req.user.id)
      return res.status(403).json({ message: "Non autorisé" });

    Object.assign(trajet, req.body);
    await trajet.save();

    res.json(trajet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTrajet = async (req, res) => {
  try {
    const trajet = await Trajet.findById(req.params.id);

    if (!trajet) return res.status(404).json({ message: "Trajet non trouvé" });
    if (trajet.conducteur.toString() !== req.user.id)
      return res.status(403).json({ message: "Non autorisé" });

    await trajet.remove();

    res.json({ message: "Trajet supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTrajets = async (req, res) => {
  try {
    const trajets = await Trajet.find({ conducteur: req.user.id })
      .populate("vehicule")
      .sort({ date_depart: 1 });

    res.json({ count: trajets.length, trajets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchTrajets = async (req, res) => {
  try {
    const criteria = { ...req.query };
    if (criteria.prix_max) criteria.prix_max = Number(criteria.prix_max);
    if (criteria.places_min) criteria.places_min = Number(criteria.places_min);

    const trajets = await Trajet.searchTrajets(criteria);

    res.json({ count: trajets.length, trajets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
