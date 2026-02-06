import { format, setMonth, setYear } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { useRef, useEffect, useState } from 'react';
import 'react-day-picker/style.css';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelinePickerProps {
    dateRange: { from: string; to: string } | null;
    onSelect: (range: { from: string; to: string } | null) => void;
    onClose: () => void;
    position: { top: number, left: number };
}

export const TimelinePicker = ({ dateRange, onSelect, onClose, position }: TimelinePickerProps) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({ top: position.top, left: position.left });

    // Parse initial range
    const initialRange: DateRange | undefined = dateRange?.from && dateRange?.to
        ? { from: new Date(dateRange.from), to: new Date(dateRange.to) }
        : undefined;

    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(initialRange);

    // View State
    const [view, setView] = useState<'calendar' | 'years' | 'months'>('calendar');
    const [month, setMonthInPicker] = useState<Date>(initialRange?.from || new Date());

    useEffect(() => {
        if (pickerRef.current) {
            const rect = pickerRef.current.getBoundingClientRect();
            let top = position.top;
            let left = position.left;

            if (top + rect.height > window.innerHeight) {
                top = position.top - rect.height - 40;
            }
            if (left + rect.width > window.innerWidth) {
                left = window.innerWidth - rect.width - 20;
            }

            setStyle({ top, left });
        }
    }, [position, view]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSelect = (range: DateRange | undefined) => {
        setSelectedRange(range);

        if (range?.from && range?.to) {
            // Adjust for timezone to ensure we store YYYY-MM-DD correctly
            const formatDate = (d: Date) => {
                const offset = d.getTimezoneOffset();
                const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
            };

            onSelect({
                from: formatDate(range.from),
                to: formatDate(range.to)
            });
        } else if (!range) {
            onSelect(null);
        }
    };

    // Calendar Navigation
    const handlePrevMonth = () => setMonthInPicker(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
    const handleNextMonth = () => setMonthInPicker(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

    const years = Array.from({ length: 201 }, (_, i) => 1900 + i);
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return createPortal(
        <div
            ref={pickerRef}
            style={{
                position: 'fixed',
                top: style.top,
                left: style.left,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                border: '1px solid #e6e9ef',
                zIndex: 9999,
                width: '320px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Inter, sans-serif'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Manual Date Inputs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#676879', fontWeight: 500, display: 'block', marginBottom: '4px' }}>From</label>
                    <input
                        type="date"
                        value={selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                            const d = e.target.valueAsDate; // UTC Midnight
                            if (d) {
                                // Fix timezone offset for display/store
                                const offset = d.getTimezoneOffset();
                                const localDate = new Date(d.getTime() + (offset * 60 * 1000));
                                handleSelect({ ...selectedRange, from: localDate });
                            } else {
                                handleSelect({ ...selectedRange, from: undefined });
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #c3c6d4',
                            fontSize: '13px',
                            color: '#323338',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#676879', fontWeight: 500, display: 'block', marginBottom: '4px' }}>To</label>
                    <input
                        type="date"
                        min={selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : undefined}
                        value={selectedRange?.to ? format(selectedRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                            const d = e.target.valueAsDate;
                            if (d) {
                                const offset = d.getTimezoneOffset();
                                const localDate = new Date(d.getTime() + (offset * 60 * 1000));
                                handleSelect({ from: selectedRange?.from, to: localDate });
                            } else {
                                handleSelect({ from: selectedRange?.from, to: undefined });
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #c3c6d4',
                            fontSize: '13px',
                            color: '#323338',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#676879' }} className="hover-bg"><ChevronLeft size={20} /></button>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setView('months')} style={{ background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer', color: '#323338' }}>{format(month, 'MMMM')}</button>
                    <button onClick={() => setView('years')} style={{ background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer', color: '#323338' }}>{format(month, 'yyyy')}</button>
                </div>
                <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#676879' }} className="hover-bg"><ChevronRight size={20} /></button>
            </div>

            <style>{`
                .hover-bg:hover { background-color: #f5f6f8 !important; }
                .rdp-nav { display: none; }
                .rdp-caption { display: none; } 
                .rdp-day_selected:not([disabled]) { 
                    background-color: #ff158a !important; 
                    color: white;
                }
                .rdp-day_range_middle {
                    background-color: #ff158a20 !important;
                    color: #ff158a !important;
                }
                .rdp-day:hover:not(.rdp-day_selected) { background-color: #f5f6f8; }
                .rdp { margin: 0; --rdp-cell-size: 36px; } 
            `}</style>

            {view === 'calendar' && (
                <DayPicker
                    mode="range"
                    selected={selectedRange}
                    month={month}
                    onMonthChange={setMonthInPicker}
                    onSelect={handleSelect}
                    showOutsideDays
                />
            )}

            {/* Years View */}
            {view === 'years' && (
                <div style={{ height: '300px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingRight: '4px' }}>
                    {years.map(year => (
                        <button
                            key={year}
                            onClick={() => {
                                setMonthInPicker(current => setYear(current, year));
                                setView('calendar');
                            }}
                            style={{
                                padding: '8px 4px',
                                border: 'none',
                                borderRadius: '4px',
                                backgroundColor: month.getFullYear() === year ? '#0073ea' : 'transparent',
                                color: month.getFullYear() === year ? 'white' : '#323338',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: month.getFullYear() === year ? 600 : 400
                            }}
                            ref={month.getFullYear() === year ? (el) => el?.scrollIntoView({ block: 'center' }) : null}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}

            {/* Months View */}
            {view === 'months' && (
                <div style={{ height: '300px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', alignContent: 'start', paddingTop: '16px' }}>
                    {months.map((m, index) => (
                        <button
                            key={m}
                            onClick={() => {
                                setMonthInPicker(current => setMonth(current, index));
                                setView('calendar');
                            }}
                            style={{
                                padding: '12px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: month.getMonth() === index ? '#0073ea' : 'transparent',
                                color: month.getMonth() === index ? 'white' : '#323338',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: month.getMonth() === index ? 600 : 400,
                                textAlign: 'center'
                            }}
                            className="hover-bg"
                        >
                            {m}
                        </button>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
};
