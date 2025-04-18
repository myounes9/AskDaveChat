import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeadsTable from '@/components/Leads/LeadsTable';
import { Lead } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadLeads = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            toast.error(`Failed to load leads: ${error.message}`);
            throw error;
        }

        setLeads(data as Lead[]);
      } catch (error) {
        console.error('Error loading leads:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLeads();
  }, []);

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
    if (selectedLead && selectedLead.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleNavigateToConversation = () => {
    if (selectedLead?.conversation_id) {
      console.log(`Navigating to conversation: /conversations/${selectedLead.conversation_id}`);
      setIsSheetOpen(false);
      navigate(`/conversations/${selectedLead.conversation_id}`);
    } else {
      toast.error("No conversation linked to this lead.");
      console.warn("Attempted to navigate to conversation but conversation_id is missing for lead:", selectedLead?.id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Interest', 'Created'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        lead.id,
        lead.name || '-',
        lead.email || '-',
        lead.phone || '-',
        lead.interest || '-',
        new Date(lead.created_at).toLocaleString()
      ].join(','))
    ].join('\n');
    
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lead Management</h1>
        
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading leads...</div>
      ) : (
        <LeadsTable 
          leads={leads} 
          onViewLead={handleViewLead} 
          onLeadUpdate={handleLeadUpdate}
        />
      )}
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
            <SheetDescription>
              Complete information about this lead.
            </SheetDescription>
          </SheetHeader>
          
          {selectedLead && (
            <div className="py-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p>{selectedLead.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p>{selectedLead.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p>{selectedLead.phone || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="capitalize">{selectedLead.status || 'new'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Interest</p>
                    <p className="capitalize">{selectedLead.interest || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date Created</p>
                    <p>{formatDate(new Date(selectedLead.created_at))}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleNavigateToConversation} 
                  disabled={!selectedLead.conversation_id}
                  variant={selectedLead.conversation_id ? "default" : "secondary"}
                >
                  {selectedLead.conversation_id ? "View Conversation" : "No Conversation Linked"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Leads;
