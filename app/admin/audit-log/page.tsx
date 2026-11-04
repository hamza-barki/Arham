'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { getAuditLogsAction, AuditLogItem } from '@/app/actions/admin-audit';
import { useAdminRole } from '@/hooks/useAdminRole';

export default function AdminAuditLogPage() {
  const { role } = useAdminRole();
  const isManagerOrAbove = role === 'manager' || role === 'admin' || role === 'super_admin';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogsAction({
        entity: selectedEntity,
        action: selectedAction,
        page: 1,
        pageSize: 50,
      });

      if (res.success) {
        setLogs(res.logs);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity, selectedAction]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const getActionColor = (action: string) => {
    if (action.includes('UPDATE') || action.includes('STATUS')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('SAVE') || action.includes('IMPORT') || action.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('INVITE') || action.includes('ROLE')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (action.includes('EXPORT')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    if (action.includes('DELETE') || action.includes('REVOKE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-800" />
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Immutable audit record of order confirmations, courier dispatches, wholesale margin updates, and RBAC security operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Logs:</span>
        </div>

        {/* Entity Select */}
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 focus:outline-emerald-800"
        >
          <option value="all">All Entities</option>
          <option value="orders">orders</option>
          <option value="products">products</option>
          <option value="user_roles">user_roles</option>
          <option value="customers">customers</option>
          <option value="areas">areas</option>
        </select>

        {/* Action Select */}
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 focus:outline-emerald-800"
        >
          <option value="all">All Actions</option>
          <option value="UPDATE_ORDER_STATUS">UPDATE_ORDER_STATUS</option>
          <option value="UPDATE_ORDER_FULFILLMENT">UPDATE_ORDER_FULFILLMENT</option>
          <option value="EXPORT_COURIER_CSV">EXPORT_COURIER_CSV</option>
          <option value="SAVE_PRODUCT">SAVE_PRODUCT</option>
          <option value="BATCH_IMPORT_MARKAZ">BATCH_IMPORT_MARKAZ</option>
          <option value="INVITE_STAFF">INVITE_STAFF</option>
          <option value="UPDATE_USER_ROLE">UPDATE_USER_ROLE</option>
          <option value="REVOKE_STAFF">REVOKE_STAFF</option>
          <option value="EXPORT_MARKETING_CUSTOMERS_CSV">EXPORT_MARKETING_CUSTOMERS_CSV</option>
        </select>

        {(selectedEntity !== 'all' || selectedAction !== 'all') && (
          <button
            onClick={() => {
              setSelectedEntity('all');
              setSelectedAction('all');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-auto"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Logs Feed */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-semibold">
          <span>Displaying latest {logs.length} events</span>
          <span>Total Recorded: {total}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-800 mb-2" />
            <p className="text-xs text-neutral-500 font-bold">Querying audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No audit records found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {logs.map((log) => {
              const isExpanded = expandedIds.has(log.id);
              const formattedDate = new Date(log.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={log.id} className="p-4 hover:bg-neutral-50/60 transition">
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
                  >
                    {/* Left: Action, Entity, Actor */}
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        className="text-neutral-400 hover:text-neutral-700 mt-0.5 sm:mt-0 shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono border uppercase tracking-wider ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-mono font-bold">
                          {log.entity}
                        </span>

                        {log.entityId && (
                          <span className="text-[11px] font-mono text-neutral-500 truncate max-w-[150px]">
                            #{log.entityId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actor & Timestamp */}
                    <div className="flex items-center gap-3 text-xs text-neutral-500 pl-7 sm:pl-0">
                      <span className="flex items-center gap-1 font-medium text-neutral-700">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {log.actorEmail || 'System'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Diff Viewer */}
                  {isExpanded && (
                    <div className="mt-3 ml-7 pt-3 border-t border-neutral-100">
                      <div className="text-[10px] font-bold uppercase text-neutral-500 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Payload / State Change Diff:
                      </div>
                      <pre className="bg-neutral-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                        {log.diff ? JSON.stringify(log.diff, null, 2) : 'No payload recorded.'}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

