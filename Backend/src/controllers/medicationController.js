const service = require("../services/medicationService"); const { assertCatalogManager } = require("../services/accessService"); const { sendError } = require("./be02ControllerHelpers");
const createMedication = async (req,res) => { try { assertCatalogManager(req.user); res.status(201).json({ message:"Medication created successfully", medication: await service.createMedication(req.body) }); } catch(e) { sendError(res,"Create medication",e); } };
const getMedications = async (req,res) => { try { res.json({ medications: await service.listMedications() }); } catch(e) { sendError(res,"Get medications",e); } };
const getMedication = async (req,res) => { try { res.json({ medication: await service.getMedication(req.params.id) }); } catch(e) { sendError(res,"Get medication",e); } };
const updateMedication = async (req,res) => { try { assertCatalogManager(req.user); res.json({ message:"Medication updated successfully", medication: await service.updateMedication(req.params.id,req.body) }); } catch(e) { sendError(res,"Update medication",e); } };
const deleteMedication = async (req,res) => { try { assertCatalogManager(req.user); await service.deleteMedication(req.params.id); res.json({ message:"Medication deleted successfully" }); } catch(e) { sendError(res,"Delete medication",e); } };
module.exports={createMedication,getMedications,getMedication,updateMedication,deleteMedication};
