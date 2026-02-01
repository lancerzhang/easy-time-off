import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Download, ExternalLink, ShieldCheck, Users, Calendar } from 'lucide-react';
import { parseISODate } from '../utils/date';
import { CLARITY_TIMESHEET_URL } from '../constants';

const formatDisplayDate = (iso?: string) => {
  if (!iso) return 'Unknown date';
  return parseISODate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const toIcsDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const buildIcs = (startIso: string, endIso: string) => {
  const startDate = parseISODate(startIso);
  const endDate = parseISODate(endIso);
  endDate.setDate(endDate.getDate() + 1); // DTEND is exclusive for all-day events

  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';
  const uid = `easy-timeoff-${Date.now()}@company.com`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Easy Time-off//Leave//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
    'SUMMARY:Time Off',
    'DESCRIPTION:Time off created from Easy Time-off',
    'TRANSP:OPAQUE',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

const LeaveSuccess: React.FC = () => {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const start = params.get('start') || '';
  const end = params.get('end') || '';

  const dateLabel = start && end
    ? `${formatDisplayDate(start)} → ${formatDisplayDate(end)}`
    : 'Dates pending';

  const handleDownload = () => {
    if (!start || !end) return;
    const content = buildIcs(start, end);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-off-${start}-to-${end}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Leave Submitted</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">You’re all set for now</h1>
            <p className="text-slate-500 mt-2">Dates: <span className="font-semibold text-slate-700">{dateLabel}</span></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!start || !end}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Download Outlook Event
            </button>
            <Link
              to="/my-leaves"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all"
            >
              Back to My Time-off
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Official request</h2>
          </div>
          <p className="text-sm text-slate-600">
            Employees: submit your formal leave request in the HR system.
            Contractors: submit the request in your vendor’s system.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Block your calendar</h2>
          </div>
          <p className="text-sm text-slate-600">
            Download the Outlook all-day event so your calendar is marked busy
            during this time and prevents meeting invites.
          </p>
          <button
            onClick={handleDownload}
            disabled={!start || !end}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Get the .ics file
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Users size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Set Out of Office</h2>
          </div>
          <p className="text-sm text-slate-600">
            Create an Outlook Out of Office reply and include who will be your
            backup during the leave.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <ExternalLink size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Fill your timesheet</h2>
          </div>
          <p className="text-sm text-slate-600">
            Record the leave in Clarity so your timesheet stays accurate.
          </p>
          <a
            href={CLARITY_TIMESHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
          >
            Open Clarity Timesheet <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LeaveSuccess;
