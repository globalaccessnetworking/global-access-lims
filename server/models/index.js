const sequelize = require('../config/database');
const User = require('./User');
const StorageLocation = require('./StorageLocation');
const BiologicalAsset = require('./BiologicalAsset');
const Chemical = require('./Chemical');
const PurchaseOrder = require('./PurchaseOrder');
const AuditLog = require('./AuditLog');
const AvailableAntibiotic = require('./AvailableAntibiotic');

const PhageHostInteraction = require('./PhageHostInteraction');
const Experiment = require('./Experiment');
const SystemAuditLog = require('./SystemAuditLog');
const CustomForm = require('./CustomForm');
const SavedQuery = require('./SavedQuery');
const PhageHostMatrix = require('./PhageHostMatrix');
const EquipmentLog = require('./EquipmentLog');
const Project = require('./Project');
const LabTask = require('./LabTask');
const ExperimentComment = require('./ExperimentComment');
const Notification = require('./Notification');

// Associations

// BiologicalAsset <-> StorageLocation
BiologicalAsset.belongsTo(StorageLocation, { foreignKey: 'storage_location_id' });
StorageLocation.hasMany(BiologicalAsset, { foreignKey: 'storage_location_id' });

// AuditLog <-> User
User.hasMany(AuditLog, { foreignKey: 'performed_by' });
AuditLog.belongsTo(User, { foreignKey: 'performed_by' });

// PurchaseOrder <-> User
PurchaseOrder.belongsTo(User, { foreignKey: 'requested_by' });
User.hasMany(PurchaseOrder, { foreignKey: 'requested_by' });

// Phage-Host Interactions
BiologicalAsset.hasMany(PhageHostInteraction, { as: 'HostInteractions', foreignKey: 'phage_id' });
BiologicalAsset.hasMany(PhageHostInteraction, { as: 'PhageInteractions', foreignKey: 'host_id' });
PhageHostInteraction.belongsTo(BiologicalAsset, { as: 'Phage', foreignKey: 'phage_id' });
PhageHostInteraction.belongsTo(BiologicalAsset, { as: 'Host', foreignKey: 'host_id' });

// Phage-Host Matrix (New Module)
BiologicalAsset.hasMany(PhageHostMatrix, { foreignKey: 'phage_id' });
BiologicalAsset.hasMany(PhageHostMatrix, { foreignKey: 'strain_id' });
PhageHostMatrix.belongsTo(BiologicalAsset, { as: 'Phage', foreignKey: 'phage_id' });
PhageHostMatrix.belongsTo(BiologicalAsset, { as: 'Strain', foreignKey: 'strain_id' });

// Experiments
User.hasMany(Experiment, { foreignKey: 'researcher_id' });
Experiment.belongsTo(User, { foreignKey: 'researcher_id' });
BiologicalAsset.hasMany(Experiment, { foreignKey: 'asset_id' });
Experiment.belongsTo(BiologicalAsset, { foreignKey: 'asset_id' });

// Source Linkage
const Source = require('./Source');
BiologicalAsset.belongsTo(Source, { foreignKey: 'source_id' });
Source.hasMany(BiologicalAsset, { foreignKey: 'source_id' });

// Antibiotic Sensitivity Linkage
const AntibioticSensitivity = require('./AntibioticSensitivity');
const InventoryStock = require('./InventoryStock');
const GenericRecord = require('./GenericRecord');

BiologicalAsset.hasMany(AntibioticSensitivity, { foreignKey: 'asset_id' });
AntibioticSensitivity.belongsTo(BiologicalAsset, { foreignKey: 'asset_id' });

AntibioticSensitivity.belongsTo(AvailableAntibiotic, { foreignKey: 'antibiotic_id' });
AvailableAntibiotic.hasMany(AntibioticSensitivity, { foreignKey: 'antibiotic_id' });

// Project & Task Associations
Project.hasMany(LabTask, { foreignKey: 'project_id', onDelete: 'CASCADE' });
LabTask.belongsTo(Project, { foreignKey: 'project_id' });

Project.hasMany(Experiment, { foreignKey: 'project_id' });
Experiment.belongsTo(Project, { foreignKey: 'project_id' });

// Experiment Comments
Experiment.hasMany(ExperimentComment, { foreignKey: 'experiment_id', onDelete: 'CASCADE' });
ExperimentComment.belongsTo(Experiment, { foreignKey: 'experiment_id' });

User.hasMany(ExperimentComment, { foreignKey: 'user_id' });
ExperimentComment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(LabTask, { foreignKey: 'assigned_to_id' });
LabTask.belongsTo(User, { as: 'Assignee', foreignKey: 'assigned_to_id' });

User.hasMany(Project, { foreignKey: 'lead_investigator_id' });
Project.belongsTo(User, { as: 'Lead', foreignKey: 'lead_investigator_id' });

module.exports = {
    sequelize,
    User,
    StorageLocation,
    BiologicalAsset,
    GenericRecord,
    Chemical,
    PurchaseOrder,
    AuditLog,
    AvailableAntibiotic,
    PhageHostInteraction,
    Experiment,
    Source,
    AntibioticSensitivity,
    InventoryStock,
    InventoryStock,
    CustomForm,
    SavedQuery,
    SystemAuditLog,
    PhageHostMatrix,
    EquipmentLog: require('./EquipmentLog'),
    Project,
    LabTask,
    ExperimentComment,
    Notification
};
