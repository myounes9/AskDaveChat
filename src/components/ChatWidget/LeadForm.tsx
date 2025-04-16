
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeadFormProps {
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interest: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormData>();
  
  return (
    <Card className="w-full my-4">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          Please provide your details so we can better assist you.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="Your phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <Input
              id="company"
              {...register('company')}
              placeholder="Your company name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interest">What are you interested in?</Label>
            <Select defaultValue="information" {...register('interest', { required: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your interest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="information">General Information</SelectItem>
                <SelectItem value="demo">Product Demo</SelectItem>
                <SelectItem value="pricing">Pricing Details</SelectItem>
                <SelectItem value="support">Technical Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Submit
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LeadForm;
