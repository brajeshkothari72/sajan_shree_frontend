// components/orders/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Printer, FileText, Trash2, MessageCircle, Loader2 } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import Card from '../ui/Card';
import Button from '../ui/Button';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Pending');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappPrompt, setWhatsappPrompt] = useState(null); // { title, message, options }

  const statuses = ['Pending', 'Processing', 'Completed', 'Shipped'];

  const WHATSAPP_LABELS = {
    sent: { text: 'Sent to WhatsApp', className: 'bg-green-100 text-green-800' },
    failed: { text: 'Failed', className: 'bg-destructive/10 text-destructive' },
    queued: { text: 'Queued', className: 'bg-yellow-100 text-yellow-800' },
    disabled: { text: 'WhatsApp not configured', className: 'bg-gray-100 text-gray-800' },
    skipped_no_phone: { text: 'No phone number', className: 'bg-gray-100 text-gray-800' },
    skipped_invalid_phone: { text: 'Invalid phone number', className: 'bg-gray-100 text-gray-800' },
    skipped_no_consent: { text: 'No consent recorded', className: 'bg-gray-100 text-gray-800' },
  };

  const sendWhatsApp = async (options = {}) => {
    try {
      setSendingWhatsApp(true);
      setWhatsappPrompt(null);
      const res = await ApiService.sendOrderWhatsApp(order._id || order.orderId, options);
      setOrder((prev) => ({ ...prev, whatsappNotification: res.whatsappNotification }));
      alert('✅ WhatsApp message sent');
    } catch (err) {
      // 400 + needsConsent = consent not recorded yet. That's recoverable, so
      // offer a confirm instead of an error.
      if (err.status === 400 && err.payload?.needsConsent) {
        setWhatsappPrompt({
          title: 'Confirm customer consent',
          message:
            'This order has no recorded WhatsApp consent. Confirm the customer agreed to receive order updates, and send?',
          options: { ...options, consent: true },
        });
      } else {
        alert(`❌ ${err?.payload?.message || err.message}`);
      }
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      setDeleting(true);
      await ApiService.deleteOrder(order._id || order.orderId);
      navigate('/orders');
    } catch (err) {
      console.error('Error deleting order:', err);
      alert(`❌ ${err?.payload?.message || err.message || 'Failed to delete order.'}`);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item) => {
      if (!item.sizes) return total;
      
      return total + Object.values(item.sizes).reduce((itemTotal, size) => {
        return itemTotal + (size.quantity * size.price);
      }, 0);
    }, 0);
  };

  // Calculate total items count
  const calculateItemsCount = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item) => {
      if (!item.sizes) return total;
      
      return total + Object.values(item.sizes).reduce((itemTotal, size) => {
        return itemTotal + (size.quantity || 0);
      }, 0);
    }, 0);
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await ApiService.getOrder(id);
        setOrder(orderData);
        setStatus(orderData.status);
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const updateStatus = async (newStatus) => {
    try {
      setStatus(newStatus);
      // TODO: Add API call to update status
      console.log('Updating status to:', newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Order not found</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  // Get all unique sizes from all items
  const getAllUniqueSizes = () => {
    const allSizes = new Set();
    if (order.items) {
      order.items.forEach(item => {
        if (item.sizes) {
          Object.keys(item.sizes).forEach(size => allSizes.add(size));
        }
      });
    }
    return Array.from(allSizes).sort((a, b) => {
      const numA = parseInt(a.split('/')[0]);
      const numB = parseInt(b.split('/')[0]);
      return numA - numB;
    });
  };

  // Calculate pieces for a single item
  const calculateItemPieces = (item) => {
    if (!item.sizes) return 0;
    return Object.values(item.sizes).reduce((total, size) => {
      return total + (size.quantity || 0);
    }, 0);
  };

  // Calculate total for a single item
  const calculateItemTotal = (item) => {
    if (!item.sizes) return 0;
    return Object.values(item.sizes).reduce((total, size) => {
      return total + ((size.quantity || 0) * (size.price || 0));
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">Order Details</h2>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted">
            <FileText className="w-4 h-4 mr-2" />
            Invoice
          </button>
          <Button onClick={() => navigate(`/orders/edit/${order._id || order.orderId}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Order Information Section */}
      <Card>
        <h3 className="text-lg font-medium text-foreground mb-4">Order Information</h3>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Order ID
            </label>
            <p className="px-3 py-2 border border-input rounded-md bg-muted text-sm">
              {order.orderId || order._id}
            </p>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Customer Name
            </label>
            <p className="px-3 py-2 border border-input rounded-md bg-muted text-sm">
              {order.customerName}
            </p>
          </div>

          {order.customerPhone && (
            <div className="col-span-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Customer Phone
              </label>
              <p className="px-3 py-2 border border-input rounded-md bg-muted text-sm">
                {order.customerPhone}
              </p>
            </div>
          )}

          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Order Date
            </label>
            <p className="px-3 py-2 border border-input rounded-md bg-muted text-sm">
              {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Due Date
            </label>
            <p className="px-3 py-2 border border-input rounded-md bg-muted text-sm">
              {new Date(order.deliveryDate).toLocaleDateString('en-IN')}
            </p>
          </div>

          {order.orderDescription && (
            <div className="col-span-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Description
              </label>
              <p className="px-3 py-2 border border-input rounded-md bg-muted text-sm">
                {order.orderDescription}
              </p>
            </div>
          )}

          {order.orderImage?.url && (
            <div className="col-span-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Order Image
              </label>
              <a href={order.orderImage.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={order.orderImage.url}
                  alt="Order"
                  className="w-48 h-48 object-cover rounded-md border border-border hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Order Items Matrix */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-foreground">Order Items</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Status: <OrderStatusBadge status={status} />
            </span>
          </div>
        </div>

        {order.items && order.items.map((item, index) => (
          <div key={index} className="mb-4 rounded-lg border border-border overflow-hidden">
            {/* Product Header */}
            <div className="bg-card px-4 py-3 flex justify-between items-center">
              <div className="font-medium text-foreground">{item.product || item.category}</div>
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-sm">
                  Pieces: {calculateItemPieces(item)}
                </span>
                <span className="text-foreground font-bold text-sm">
                  Total: ₹{calculateItemTotal(item).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Size Matrix */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="w-24 px-3 py-2 text-center text-xs font-semibold text-foreground bg-primary/10">SIZE</th>
                    {item.sizes && Object.keys(item.sizes).sort((a, b) => {
                      const numA = parseInt(a.split('/')[0]);
                      const numB = parseInt(b.split('/')[0]);
                      return numA - numB;
                    }).map(size => (
                      <th key={`${index}-${size}`} className="px-2 py-2 text-center font-semibold text-foreground">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-muted">
                    <td className="w-24 px-2 py-2 text-center text-xs font-medium text-foreground bg-primary/10">QTY</td>
                    {item.sizes && Object.keys(item.sizes).sort((a, b) => {
                      const numA = parseInt(a.split('/')[0]);
                      const numB = parseInt(b.split('/')[0]);
                      return numA - numB;
                    }).map(size => (
                      <td key={`${index}-${size}-qty`} className="px-2 py-2 text-center font-medium">
                        {item.sizes[size]?.quantity || 0}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-muted">
                    <td className="w-24 px-2 py-2 text-center text-xs font-medium text-foreground bg-primary/10">PRICE</td>
                    {item.sizes && Object.keys(item.sizes).sort((a, b) => {
                      const numA = parseInt(a.split('/')[0]);
                      const numB = parseInt(b.split('/')[0]);
                      return numA - numB;
                    }).map(size => (
                      <td key={`${index}-${size}-price`} className="px-2 py-2 text-center font-medium">
                        ₹{item.sizes[size]?.price || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Product Details if available */}
            {item.details && Object.keys(item.details).length > 0 && (
              <div className="p-4 bg-muted border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Product Details</h4>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(item.details).map(([key, value]) => {
                    // Skip image fields
                    if (key.includes('Image')) return null;
                    return (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="ml-2 font-medium text-foreground">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Grand Total */}
        <div className="flex justify-end border-t border-border pt-4 mt-4">
          <div className="flex space-x-8 text-right">
            <div>
              <div className="text-sm text-muted-foreground">Total Pieces:</div>
              <div className="text-xl font-semibold text-foreground">{calculateItemsCount(order)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Grand Total:</div>
              <div className="text-2xl font-bold text-foreground">₹{calculateOrderTotal(order).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status & Summary */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Order Status & Summary</h3>
          <select
            value={status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-4 py-2 border border-input rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {statuses.map(s => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Pieces</div>
            <div className="text-2xl font-bold text-foreground">{calculateItemsCount(order)}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-foreground">₹{calculateOrderTotal(order).toFixed(2)}</div>
          </div>
        </div>

        {/* WhatsApp confirmation */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">WhatsApp confirmation</span>
              {(() => {
                const wa = order.whatsappNotification;
                const label = wa && WHATSAPP_LABELS[wa.status];
                return (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      label ? label.className : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {label ? label.text : 'Not sent'}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {order.whatsappNotification?.sentAt
                ? `Sent ${new Date(order.whatsappNotification.sentAt).toLocaleString('en-IN')}`
                : order.whatsappNotification?.lastError || 'The customer has not been messaged yet.'}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => sendWhatsApp()}
            disabled={sendingWhatsApp || !order.customerPhone}
            title={order.customerPhone ? undefined : 'Add a customer phone number to this order first'}
          >
            {sendingWhatsApp ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            {order.whatsappNotification?.status === 'sent' ? 'Send again' : 'Send WhatsApp'}
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => { if (!deleting) setConfirmDelete(false); }}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message={`Are you sure you want to delete order ${order.orderId || order._id}? This action cannot be undone.`}
      />

      <ConfirmDialog
        isOpen={!!whatsappPrompt}
        onClose={() => setWhatsappPrompt(null)}
        onConfirm={() => sendWhatsApp(whatsappPrompt.options)}
        title={whatsappPrompt?.title || ''}
        message={whatsappPrompt?.message || ''}
      />
    </div>
  );
};

export default OrderDetail;

