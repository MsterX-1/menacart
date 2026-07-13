import React, { useState } from 'react';
import { useMyShippingRules, useCreateShippingRule, useDeleteShippingRule } from './hooks/useShippingRules';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const ShippingRulesPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: rules, isLoading } = useMyShippingRules();
  const createMutation = useCreateShippingRule();
  const deleteMutation = useDeleteShippingRule();

  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [freeShippingAbove, setFreeShippingAbove] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('3');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country || !shippingCost || !estimatedDays) {
      toastError('Please fill in all required fields.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        city: city.trim(),
        country: country.trim(),
        shippingCost: parseFloat(shippingCost),
        freeShippingAbove: freeShippingAbove.trim() ? parseFloat(freeShippingAbove) : null,
        estimatedDays: parseInt(estimatedDays, 10),
      });
      toastSuccess('Shipping rule created successfully!');
      setCity('');
      setCountry('');
      setShippingCost('');
      setFreeShippingAbove('');
      setEstimatedDays('3');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create rule.');
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!window.confirm('Are you sure you want to delete this shipping rule? Buyers from this region will no longer be able to purchase your products unless another rule matches.')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(ruleId);
      toastSuccess('Shipping rule deleted.');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete rule.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton variant="rect" height="400px" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700 }}>Shipping Rules</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--color-text-subtle)' }}>
        Define where you deliver and how much it costs. If a buyer is in a location not covered by these rules, they will not be able to purchase your items. Use a blank city to apply a rule to an entire country.
      </p>
      
      <div className="shadow-card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'var(--color-bg-panel)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add New Rule</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
          
          <Input
            label="Country *"
            type="text"
            placeholder="e.g. Egypt"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />

          <Input
            label="City (Optional)"
            type="text"
            placeholder="e.g. Cairo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="Shipping Cost (EGP) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 50"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            required
          />

          <Input
            label="Free Shipping Above (EGP)"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 500"
            value={freeShippingAbove}
            onChange={(e) => setFreeShippingAbove(e.target.value)}
          />

          <Input
            label="Estimated Days to Deliver *"
            type="number"
            min="1"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            required
          />

          <div style={{ paddingBottom: '2px' }}>
            <Button type="submit" isLoading={createMutation.isPending} style={{ width: '100%' }}>
              Add Rule
            </Button>
          </div>
        </form>
      </div>

      <div className="shadow-card" style={{ padding: '2rem', backgroundColor: 'var(--color-bg-panel)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Active Shipping Rules</h2>
        
        {!rules || rules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-subtle)' }}>
            <p>You haven't set up any shipping rules yet.</p>
            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>Warning: Your products cannot be purchased until you add at least one shipping rule.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border-subtle)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Destination</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Shipping Cost</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Free Shipping Above</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Est. Days</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.ruleId} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>{rule.country}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                        {rule.city ? `City: ${rule.city}` : 'All Cities'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{rule.shippingCost === 0 ? 'FREE' : `${rule.shippingCost.toFixed(2)} EGP`}</td>
                    <td style={{ padding: '1rem' }}>{rule.freeShippingAbove ? `${rule.freeShippingAbove.toFixed(2)} EGP` : '-'}</td>
                    <td style={{ padding: '1rem' }}>{rule.estimatedDays} days</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(rule.ruleId)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
