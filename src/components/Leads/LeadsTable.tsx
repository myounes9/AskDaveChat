import React, { useState } from 'react';
import { Lead } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadsTableProps {
  leads: Lead[];
  onViewLead?: (lead: Lead) => void;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'disqualified', 'converted'];

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onViewLead, onLeadUpdate }) => {
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [leadId]: true }));
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error("Error updating lead status:", error);
        toast.error(`Failed to update status: ${error.message}`);
        throw error;
      }

      if (data) {
        toast.success(`Lead status updated to ${newStatus}`);
        if (onLeadUpdate) {
          onLeadUpdate(data as Lead);
        }
      } else {
          toast.warning("Status updated, but failed to retrieve updated lead data.");
      }

    } catch (error) {
        // Error already logged and toasted inside try block
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [leadId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableCaption>A list of all leads collected through the chatbot.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No leads collected yet.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{formatDate(lead.created_at)}</TableCell>
                <TableCell>{lead.name || '-'}</TableCell>
                <TableCell>{lead.email || '-'}</TableCell>
                <TableCell>{lead.phone || '-'}</TableCell>
                <TableCell>{lead.interest || '-'}</TableCell>
                <TableCell>
                  <Select 
                    value={lead.status || 'new'} 
                    onValueChange={(newStatus) => handleStatusChange(lead.id, newStatus)}
                    disabled={updatingStatus[lead.id]}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs capitalize">
                      <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(status => (
                        <SelectItem key={status} value={status} className="text-xs capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updatingStatus[lead.id] && <span className="text-xs ml-1 text-muted-foreground">...</span>}
                </TableCell>
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
