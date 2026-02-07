import React, { useState } from 'react';
import { Mail, FileText, Shield, Percent, Search, Download, CheckCircle, Clock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type EmailType = 'quotation_created' | 'quotation_revised' | 'master_otp' | 'discount_otp' | 'quotation_sent';

interface EmailLog {
  id: string;
  type: EmailType;
  subject: string;
  sentTo: string;
  reference: string;
  referenceId: string;
  status: 'sent' | 'pending' | 'failed';
  createdAt: Date;
}

const emailTypeLabels: Record<EmailType, { label: string; icon: React.ReactNode; color: string }> = {
  quotation_created: { label: 'Quotation Created', icon: <FileText className="h-4 w-4" />, color: 'text-primary' },
  quotation_revised: { label: 'Quotation Revised', icon: <FileText className="h-4 w-4" />, color: 'text-warning' },
  quotation_sent: { label: 'Quotation Sent', icon: <Mail className="h-4 w-4" />, color: 'text-success' },
  master_otp: { label: 'Master OTP Sent', icon: <Shield className="h-4 w-4" />, color: 'text-accent' },
  discount_otp: { label: 'Discount OTP Used', icon: <Percent className="h-4 w-4" />, color: 'text-destructive' },
};

const EmailLogs: React.FC = () => {
  const { quotations, customers, otpLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Generate simulated email logs from actual data
  const generateEmailLogs = (): EmailLog[] => {
    const logs: EmailLog[] = [];

    // Quotation creation emails
    quotations.forEach(q => {
      const customer = customers.find(c => c.id === q.customerId);
      logs.push({
        id: `email-qt-created-${q.id}`,
        type: 'quotation_created',
        subject: `Quotation ${q.quotationNo} Created`,
        sentTo: customer?.email || 'N/A',
        reference: q.quotationNo,
        referenceId: q.id,
        status: 'sent',
        createdAt: q.createdAt,
      });

      // If quotation was sent
      if (q.status === 'sent' || q.status === 'approved') {
        logs.push({
          id: `email-qt-sent-${q.id}`,
          type: 'quotation_sent',
          subject: `Quotation ${q.quotationNo} Sent to Customer`,
          sentTo: customer?.email || 'N/A',
          reference: q.quotationNo,
          referenceId: q.id,
          status: 'sent',
          createdAt: new Date(new Date(q.createdAt).getTime() + 3600000), // 1 hour after creation
        });
      }

      // If quotation was updated (simulate revision)
      if (q.updatedAt && q.updatedAt !== q.createdAt) {
        logs.push({
          id: `email-qt-revised-${q.id}`,
          type: 'quotation_revised',
          subject: `Quotation ${q.quotationNo} Revised`,
          sentTo: customer?.email || 'N/A',
          reference: q.quotationNo,
          referenceId: q.id,
          status: 'sent',
          createdAt: q.updatedAt,
        });
      }
    });

    // OTP emails
    otpLogs.forEach(log => {
      if (log.type === 'master_activation') {
        logs.push({
          id: `email-otp-master-${log.id}`,
          type: 'master_otp',
          subject: `OTP for Master Activation: ${log.entityType}`,
          sentTo: log.requestedBy,
          reference: log.entityType,
          referenceId: log.entityId,
          status: 'sent',
          createdAt: log.createdAt,
        });
      } else if (log.type === 'discount') {
        logs.push({
          id: `email-otp-discount-${log.id}`,
          type: 'discount_otp',
          subject: 'OTP for Discount Override',
          sentTo: log.requestedBy,
          reference: 'Quotation Item',
          referenceId: log.entityId,
          status: 'sent',
          createdAt: log.createdAt,
        });
      }
    });

    // Sort by date descending
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const emailLogs = generateEmailLogs();

  const filteredLogs = emailLogs.filter(log => {
    const matchesSearch = 
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sentTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.type === filterType;

    return matchesSearch && matchesType;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    toast.success('Export functionality - UI simulation only');
  };

  // Summary counts
  const quotationEmails = emailLogs.filter(l => l.type.startsWith('quotation')).length;
  const otpEmails = emailLogs.filter(l => l.type.includes('otp')).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of all system emails
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <Mail className="h-5 w-5 text-accent" />
          <p className="stat-value">{emailLogs.length}</p>
          <p className="stat-label">Total Emails</p>
        </div>
        <div className="stat-card">
          <FileText className="h-5 w-5 text-primary" />
          <p className="stat-value">{quotationEmails}</p>
          <p className="stat-label">Quotation Emails</p>
        </div>
        <div className="stat-card">
          <Shield className="h-5 w-5 text-warning" />
          <p className="stat-value">{otpEmails}</p>
          <p className="stat-label">OTP Emails</p>
        </div>
        <div className="stat-card">
          <CheckCircle className="h-5 w-5 text-success" />
          <p className="stat-value">{emailLogs.filter(l => l.status === 'sent').length}</p>
          <p className="stat-label">Successfully Sent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="enterprise-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, email, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="quotation_created">Quotation Created</SelectItem>
              <SelectItem value="quotation_revised">Quotation Revised</SelectItem>
              <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
              <SelectItem value="master_otp">Master OTP</SelectItem>
              <SelectItem value="discount_otp">Discount OTP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th className="hidden sm:table-cell">Subject</th>
                <th className="hidden md:table-cell">Sent To</th>
                <th className="hidden lg:table-cell">Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No email logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const typeInfo = emailTypeLabels[log.type];
                  return (
                    <tr key={log.id}>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                          {typeInfo.icon}
                          <span className="text-sm font-medium hidden sm:inline">{typeInfo.label}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell font-medium max-w-[200px] truncate">
                        {log.subject}
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground">
                        {log.sentTo}
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {log.reference}
                        </span>
                      </td>
                      <td>
                        {log.status === 'sent' ? (
                          <span className="badge-success">
                            <CheckCircle className="h-3 w-3" /> Sent
                          </span>
                        ) : log.status === 'pending' ? (
                          <span className="badge-warning">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        ) : (
                          <span className="badge-error">Failed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="text-center text-sm text-muted-foreground">
        <p>* This is a simulated email log for demonstration purposes. Actual email delivery is not implemented.</p>
      </div>
    </div>
  );
};

export default EmailLogs;
