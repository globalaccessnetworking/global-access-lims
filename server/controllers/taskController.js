const { LabTask, User, Project } = require('../models');

exports.getTasks = async (req, res) => {
    try {
        const { project_id, status } = req.query;
        const where = {};
        if (project_id) where.project_id = project_id;
        if (status) where.status = status;

        const tasks = await LabTask.findAll({
            where,
            include: [
                { model: Project, attributes: ['id', 'name'] },
                { model: User, as: 'Assignee', attributes: ['id', 'username'] }
            ],
            order: [['due_date', 'ASC']]
        });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createTask = async (req, res) => {
    try {
        const task = await LabTask.create(req.body);
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await LabTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        await task.update(req.body);
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await LabTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        await task.destroy();
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
