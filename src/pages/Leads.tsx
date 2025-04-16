
import React, { useState, useEffect } from 'react';
import LeadsTable from '@/components/Leads/LeadsTable';
import { Lead } from '@/types';
import { fetchLeads } from '@/services/mock-data';
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

  useEffect(() => {
    const loadLeads = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLeads();
        setLeads(data);
      } catch (error) {
        console.error('Error loading leads:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLeads();
  }, []);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleExportCSV = () => {
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
        new Date(lead.createdAt).toLocaleString()
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
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p>{selectedLead.company || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Interest</p>
                    <p className="capitalize">{selectedLead.interest || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Source</p>
                    <p className="capitalize">{selectedLead.source}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date Created</p>
                    <p>{formatDate(selectedLead.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button className="w-full">View Conversation</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Leads;
