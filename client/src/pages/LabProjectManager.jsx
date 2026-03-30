import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Layout,
    Plus,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Briefcase,
    MoreVertical,
    ChevronRight,
    Search,
    Filter,
    Activity,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectMemberManager from '../components/ProjectMemberManager';
import SmartLookup from '../components/SmartLookup';


const LabProjectManager = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [memberManagerProjectId, setMemberManagerProjectId] = useState(null);

    const [newProject, setNewProject] = useState({ name: '', description: '', status: 'Active', color_code: '#10b981' });
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', status: 'Todo', due_date: '', assigned_to_id: '' });

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            setProjects(res.data);
            if (res.data.length > 0 && !selectedProject) {
                handleSelectProject(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const handleSelectProject = async (project) => {
        setSelectedProject(project);
        try {
            const res = await api.get(`/tasks?project_id=${project.id}`);
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setIsNewProjectModalOpen(false);
            fetchData();
        } catch (err) {
            alert("Failed to create project");
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', { ...newTask, project_id: selectedProject.id });
            setIsNewTaskModalOpen(false);
            handleSelectProject(selectedProject);
        } catch (err) {
            alert("Failed to create task");
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            handleSelectProject(selectedProject);
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const COLUMNS = [
        { id: 'Todo', label: 'To Do', icon: Clock, color: 'text-slate-400' },
        { id: 'In Progress', label: 'In Progress', icon: Activity, color: 'text-blue-400' },
        { id: 'Review', label: 'Review', icon: AlertCircle, color: 'text-purple-400' },
        { id: 'Completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' }
    ];

    if (loading && projects.length === 0) return <div className="p-8 text-emerald-500">Loading Research Projects...</div>;

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 p-6 overflow-hidden">
            {/* LHS: Project Sidebar */}
            <div className="w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-emerald-400" /> Projects
                    </h2>
                    <button
                        onClick={() => setIsNewProjectModalOpen(true)}
                        className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${selectedProject?.id === project.id
                                ? 'bg-slate-800 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5"
                                style={{ backgroundColor: project.color_code }}
                            />
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-white truncate flex-1">{project.name}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMemberManagerProjectId(project.id);
                                    }}
                                    className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all border border-indigo-500/20 opacity-0 group-hover:opacity-100"
                                    title="Manage Members"
                                >
                                    <Users size={14} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                <span>{project.status}</span>
                                <span>{project.LabTasks?.length || 0} Tasks</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* RHS: Canvas */}
            <div className="flex-1 flex flex-col gap-6">
                {selectedProject ? (
                    <>
                        <div className="flex items-end justify-between border-b border-white/5 pb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">{selectedProject.name}</h1>
                                <p className="text-slate-400 mt-1 max-w-2xl">{selectedProject.description}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsNewTaskModalOpen(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> New Task
                                </button>
                            </div>
                        </div>

                        {/* Kanban Board */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden">
                            {COLUMNS.map(col => {
                                const colTasks = tasks.filter(t => t.status === col.id);
                                return (
                                    <div key={col.id} className="flex flex-col gap-4 bg-slate-900/30 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-2">
                                                <col.icon className={`w-4 h-4 ${col.color}`} />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{col.label}</span>
                                            </div>
                                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">{colTasks.length}</span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                            <AnimatePresence>
                                                {colTasks.map(task => (
                                                    <motion.div
                                                        key={task.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-[#1E293B] border border-white/10 p-4 rounded-xl shadow-lg group relative hover:border-white/30 transition-colors"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                                task.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                                    task.priority === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-slate-500/20 text-slate-400'
                                                                }`}>
                                                                {task.priority}
                                                            </span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {col.id !== 'Completed' && (
                                                                    <button
                                                                        onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1].id)}
                                                                        className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-colors"
                                                                    >
                                                                        <ChevronRight size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-white mb-2">{task.title}</h4>
                                                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{task.description}</p>

                                                        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                                <User size={12} />
                                                                <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">
                                                                    {task.Assignee?.username || 'Unassigned'}
                                                                </span>
                                                            </div>
                                                            {task.due_date && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                                    <Calendar size={12} />
                                                                    <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                            <Briefcase className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Research Projects</h2>
                        <p className="text-slate-500 max-w-sm">Create your first lab project to start assigning and tracking tasks.</p>
                        <button
                            onClick={() => setIsNewProjectModalOpen(true)}
                            className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={20} /> Create New Project
                        </button>
                    </div>
                )}
            </div>

            {/* Modals ... (Project and Task) */}
            <AnimatePresence>
                {/* Project Modal */}
                {isNewProjectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 rounded-3xl w-full max-w-md border border-white/10 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xl font-bold text-white">New Research Project</h3>
                            </div>
                            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                                <div>
                                    <SmartLookup 
                                        label="Project Status" 
                                        module="projects" 
                                        field="status" 
                                        value={newProject.status} 
                                        onChange={v => setNewProject({ ...newProject, status: v })} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                    <textarea rows={3} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsNewProjectModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold">Cancel</button>
                                    <button type="submit" className="px-8 py-3 bg-emerald-600 rounded-xl text-white font-bold hover:shadow-lg shadow-emerald-500/20 transition-all">Create Project</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Task Modal */}
                {isNewTaskModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 rounded-3xl w-full max-w-md border border-white/10 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xl font-bold text-white">Add Lab Task</h3>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Task Title</label>
                                    <input required type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <SmartLookup 
                                            label="Priority" 
                                            module="tasks" 
                                            field="priority" 
                                            value={newTask.priority} 
                                            onChange={v => setNewTask({ ...newTask, priority: v })} 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Due Date</label>
                                        <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-white outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <SmartLookup 
                                        label="Assign To (Researcher)" 
                                        module="users" 
                                        field="username" 
                                        value={users.find(u => u.id === newTask.assigned_to_id)?.username || ''} 
                                        onChange={val => {
                                            const user = users.find(u => u.username === val);
                                            if (user) setNewTask({ ...newTask, assigned_to_id: user.id });
                                        }} 
                                        placeholder="Search Researcher..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsNewTaskModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold">Cancel</button>
                                    <button type="submit" className="px-8 py-3 bg-emerald-600 rounded-xl text-white font-bold hover:shadow-lg shadow-emerald-500/20 transition-all">Create Task</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LabProjectManager;
