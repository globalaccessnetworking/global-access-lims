import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader, Download, Edit2, Check } from 'lucide-react';
import api from '../api/axios';

const AttachmentGallery = ({ entityType, entityId }) => {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [editingCaption, setEditingCaption] = useState(null);
    const [captionText, setCaptionText] = useState('');

    useEffect(() => {
        if (entityType && entityId) {
            fetchAttachments();
        }
    }, [entityType, entityId]);

    const fetchAttachments = async () => {
        try {
            const response = await api.get(`/attachments/${entityType}/${entityId}`);
            setAttachments(response.data.attachments || []);
        } catch (error) {
            console.error('Failed to fetch attachments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('entityType', entityType);
            formData.append('entityId', entityId);

            try {
                await api.post('/attachments/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } catch (error) {
                alert(`Failed to upload ${file.name}: ` + error.message);
            }
        }

        setUploading(false);
        fetchAttachments();
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;

        try {
            await api.delete(`/attachments/${id}`);
            fetchAttachments();
        } catch (error) {
            alert('Failed to delete attachment: ' + error.message);
        }
    };

    const handleUpdateCaption = async (id) => {
        try {
            await api.put(`/attachments/${id}/caption`, { caption: captionText });
            setEditingCaption(null);
            setCaptionText('');
            fetchAttachments();
        } catch (error) {
            alert('Failed to update caption: ' + error.message);
        }
    };

    const startEditCaption = (attachment) => {
        setEditingCaption(attachment.id);
        setCaptionText(attachment.caption || '');
    };

    if (!entityType || !entityId) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors bg-slate-50">
                <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id={`file-upload-${entityType}-${entityId}`}
                    disabled={uploading}
                />
                <label
                    htmlFor={`file-upload-${entityType}-${entityId}`}
                    className="cursor-pointer"
                >
                    {uploading ? (
                        <Loader className="w-12 h-12 text-indigo-500 mx-auto mb-2 animate-spin" />
                    ) : (
                        <Upload className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-slate-600 font-medium">
                        {uploading ? 'Uploading...' : 'Click to upload images or drag and drop'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF, PDF up to 10MB</p>
                </label>
            </div>

            {/* Gallery Grid */}
            {loading ? (
                <div className="text-center py-8">
                    <Loader className="w-8 h-8 text-slate-400 mx-auto animate-spin" />
                </div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No attachments yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="relative group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Image Preview */}
                            {attachment.file_type.startsWith('image/') ? (
                                <div
                                    className="aspect-square bg-slate-100 cursor-pointer"
                                    onClick={() => setLightboxImage(attachment)}
                                >
                                    <img
                                        src={`/${attachment.file_path}`}
                                        alt={attachment.caption || attachment.file_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square bg-slate-100 flex items-center justify-center">
                                    <Download className="w-8 h-8 text-slate-400" />
                                </div>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(attachment.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Caption */}
                            <div className="p-2">
                                {editingCaption === attachment.id ? (
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            value={captionText}
                                            onChange={(e) => setCaptionText(e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded"
                                            placeholder="Add caption..."
                                        />
                                        <button
                                            onClick={() => handleUpdateCaption(attachment.id)}
                                            className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => startEditCaption(attachment)}
                                        className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 rounded px-1"
                                    >
                                        <p className="text-xs text-slate-600 truncate flex-1">
                                            {attachment.caption || 'Add caption...'}
                                        </p>
                                        <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 mt-1">
                                    {new Date(attachment.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={`/${lightboxImage.file_path}`}
                        alt={lightboxImage.caption || lightboxImage.file_name}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {lightboxImage.caption && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg max-w-2xl">
                            <p className="text-sm">{lightboxImage.caption}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttachmentGallery;
