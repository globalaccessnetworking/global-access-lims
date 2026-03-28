import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Clock, Calculator, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

const ProtocolWorkflow = ({ protocol, executionId, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [stepData, setStepData] = useState({});
    const [timer, setTimer] = useState(null);
    const [timerActive, setTimerActive] = useState(false);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const toast = useToast();

    const steps = protocol.steps || [];
    const step = steps[currentStep];

    // Timer logic
    useEffect(() => {
        let interval;
        if (timerActive && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        toast.info(`⏰ Timer complete for: ${step.title}`);
                        if (step.reminder) {
                            toast.warning(step.reminder);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, timer, step, toast]);

    // Auto-save progress
    useEffect(() => {
        if (executionId) {
            saveProgress();
        }
    }, [currentStep, stepData, completedSteps]);

    const saveProgress = async () => {
        try {
            await api.put(`/protocols/executions/${executionId}/step`, {
                currentStep,
                stepData,
                status: currentStep >= steps.length - 1 && completedSteps.has(currentStep) ? 'completed' : 'in_progress'
            });
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    const startTimer = () => {
        if (step.timer) {
            setTimer(step.timer * 60); // Convert minutes to seconds
            setTimerActive(true);
        }
    };

    const pauseTimer = () => {
        setTimerActive(false);
    };

    const calculateValues = () => {
        if (!step.calculation) return {};

        const calc = step.calculation;
        const results = {};

        if (calc.outputs) {
            // Multiple outputs (e.g., PCR master mix)
            Object.entries(calc.outputs).forEach(([key, baseValue]) => {
                const multiplier = stepData[calc.inputs[0]] || 1;
                results[key] = (baseValue * multiplier).toFixed(2);
            });
        } else {
            // Single output (e.g., isopropanol volume)
            const formula = calc.formula;
            let result = 0;

            // Simple formula evaluation
            calc.inputs.forEach(input => {
                const value = parseFloat(stepData[input]) || 0;
                result = eval(formula.replace(input, value));
            });

            results[calc.output] = result.toFixed(2);
        }

        return results;
    };

    const handleInputChange = (key, value) => {
        setStepData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const completeStep = () => {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        toast.success(`✓ Step ${currentStep + 1} completed`);
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            setTimer(null);
            setTimerActive(false);
        } else {
            onComplete();
            toast.success('🎉 Protocol completed!');
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            setTimer(null);
            setTimerActive(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const calculatedValues = step?.type === 'calculation' ? calculateValues() : {};

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white">{protocol.name}</h2>
                    <span className="text-slate-400">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Current Step */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 mb-6"
                >
                    {/* Step Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-slate-400">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {step.type === 'timed' && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1">
                                    <Clock size={14} />
                                    {step.duration} min
                                </span>
                            )}
                            {step.type === 'calculation' && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-1">
                                    <Calculator size={14} />
                                    Auto-calc
                                </span>
                            )}
                            {completedSteps.has(currentStep) && (
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-1">
                                    <Check size={14} />
                                    Done
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Timer Display */}
                    {step.type === 'timed' && timer !== null && (
                        <div className="mb-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-4xl font-mono font-bold text-blue-400 mb-2">
                                        {formatTime(timer)}
                                    </div>
                                    {step.reminder && (
                                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                            <AlertCircle size={16} />
                                            {step.reminder}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={timerActive ? pauseTimer : startTimer}
                                    className={`p-4 rounded-xl transition-colors ${timerActive
                                            ? 'bg-yellow-500 hover:bg-yellow-600'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                        } text-white`}
                                >
                                    {timerActive ? <Pause size={24} /> : <Play size={24} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Calculation Inputs */}
                    {step.type === 'calculation' && (
                        <div className="mb-6 p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <h4 className="text-lg font-semibold text-white mb-4">Enter Values</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {step.calculation.inputs.map(input => (
                                    <div key={input}>
                                        <label className="block text-sm text-slate-400 mb-2 capitalize">
                                            {input.replace('_', ' ')}
                                        </label>
                                        <input
                                            type="number"
                                            value={stepData[input] || ''}
                                            onChange={(e) => handleInputChange(input, e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            placeholder="Enter value"
                                        />
                                    </div>
                                ))}
                            </div>
                            {Object.keys(calculatedValues).length > 0 && (
                                <div className="pt-4 border-t border-purple-500/20">
                                    <h5 className="text-sm font-semibold text-purple-400 mb-2">Calculated Values:</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(calculatedValues).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                                                <span className="text-slate-400 capitalize text-sm">{key.replace('_', ' ')}:</span>
                                                <span className="text-purple-400 font-mono font-bold">{value}µl</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-white mb-3">Instructions</h4>
                        {step.instructions.map((instruction, idx) => {
                            // Replace calculation placeholders
                            let displayInstruction = instruction;
                            Object.entries(calculatedValues).forEach(([key, value]) => {
                                displayInstruction = displayInstruction.replace(`{${key}}`, `<strong class="text-purple-400">${value}</strong>`);
                            });

                            return (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                                        {idx + 1}
                                    </span>
                                    <p
                                        className="text-slate-300 flex-1"
                                        dangerouslySetInnerHTML={{ __html: displayInstruction }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>

                <div className="flex gap-3">
                    {!completedSteps.has(currentStep) && (
                        <button
                            onClick={completeStep}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 transition-colors"
                        >
                            <Check size={20} />
                            Mark Complete
                        </button>
                    )}
                    <button
                        onClick={nextStep}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-colors"
                    >
                        {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProtocolWorkflow;
