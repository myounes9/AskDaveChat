
import React from 'react';
import { Lead } from '@/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  onViewLead?: (lead: Lead) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onViewLead }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Interest', 'Source', 'Created'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        lead.id,
        lead.name || '-',
        lead.email || '-',
        lead.phone || '-',
        lead.company || '-',
        lead.interest || '-',
        lead.source,
        formatDate(lead.createdAt)
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Collected Leads</h2>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <Table>
        <TableCaption>A list of all leads collected through the chatbot.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No leads collected yet.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{formatDate(lead.createdAt)}</TableCell>
                <TableCell>{lead.name || '-'}</TableCell>
                <TableCell>{lead.email || '-'}</TableCell>
                <TableCell>{lead.phone || '-'}</TableCell>
                <TableCell>{lead.company || '-'}</TableCell>
                <TableCell>{lead.interest || '-'}</TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell className="text-right">
                  {onViewLead && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onViewLead(lead)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadsTable;
