import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { 
  MessageCircle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  FileText, 
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  PackageCheck,
  Hash,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Download
} from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const { currentOrder, setActiveTab } = useCart();

  // Fire confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const handleDownloadInvoice = () => {
    if (!currentOrder) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = 14;

    // ── 1. Top Brand Header Banner ──
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, contentW, 24, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PJR SWAGROOHA FOODS', margin + 6, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Authentic Homemade Telugu Delicacies | Fresh & Pure', margin + 6, y + 17);

    // Right-aligned Invoice Title & Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11); // amber-400
    doc.text('ORDER RECEIPT / INVOICE', pageW - margin - 6, y + 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Order #${currentOrder.orderId}`, pageW - margin - 6, y + 17, { align: 'right' });

    y += 30;

    // ── 2. Two-Column Metadata Box ──
    const colW = (contentW - 6) / 2;
    const boxH = 42;

    // Left Box: Customer Info
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, colW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('CUSTOMER / DELIVERY TO:', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Name: ${currentOrder.customer.name}`, margin + 4, y + 13);
    doc.text(`Phone: ${currentOrder.customer.phone}`, margin + 4, y + 19);
    doc.text(`Zone: ${currentOrder.area.name}`, margin + 4, y + 25);

    // Address text with automatic line-wrapping
    const rawAddress = `Address: ${currentOrder.customer.address}`;
    const wrappedAddress = doc.splitTextToSize(rawAddress, colW - 8);
    const addressLines = wrappedAddress.slice(0, 2); // max 2 lines
    doc.text(addressLines, margin + 4, y + 31);

    // Right Box: Order & Payment Info
    const rightX = margin + colW + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightX, y, colW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('ORDER & PAYMENT DETAILS:', rightX + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const orderDateStr = new Date(currentOrder.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    doc.text(`Date: ${orderDateStr}`, rightX + 4, y + 13);

    const deliveryDay = currentOrder.deliveryDate?.dayOfWeekName || 'Scheduled Slot';
    const deliveryDateStr = currentOrder.deliveryDate?.formattedDate || '';
    doc.text(`Delivery: ${deliveryDay} (${deliveryDateStr})`, rightX + 4, y + 19);

    doc.text(`Payment: Direct UPI (Confirmed)`, rightX + 4, y + 31);

    y += boxH + 8;

    // ── 3. Ordered Items Table ──
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentW, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('#', margin + 3, y + 5.5);
    doc.text('ITEM NAME & PACK SIZE', margin + 12, y + 5.5);
    doc.text('QTY', margin + 105, y + 5.5, { align: 'center' });
    doc.text('UNIT PRICE', margin + 140, y + 5.5, { align: 'right' });
    doc.text('AMOUNT', pageW - margin - 4, y + 5.5, { align: 'right' });

    y += 8;

    // Table Body Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    currentOrder.items.forEach((item, index) => {
      const itemRowH = 7.5;

      // Subtle row border
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + itemRowH, pageW - margin, y + itemRowH);

      doc.text(`${index + 1}`, margin + 3, y + 5);
      
      const itemNameText = `${item.product.name} (${item.selectedWeightLabel})`;
      const cleanItemName = doc.splitTextToSize(itemNameText, 85)[0] || itemNameText;
      doc.text(cleanItemName, margin + 12, y + 5);

      doc.text(`${item.quantity}`, margin + 105, y + 5, { align: 'center' });
      doc.text(`Rs. ${item.unitPrice}`, margin + 140, y + 5, { align: 'right' });
      doc.text(`Rs. ${item.unitPrice * item.quantity}`, pageW - margin - 4, y + 5, { align: 'right' });

      y += itemRowH;
    });

    y += 4;

    // ── 4. Financial Summary Calculation Box ──
    const summaryW = 85;
    const summaryX = pageW - margin - summaryW;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(summaryX, y, summaryW, 30, 2, 2, 'FD');

    let sumY = y + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text('Items Subtotal:', summaryX + 4, sumY);
    doc.text(`Rs. ${currentOrder.subtotal}`, summaryX + summaryW - 4, sumY, { align: 'right' });

    sumY += 6;
    doc.text(`Delivery Charge (${currentOrder.area.name}):`, summaryX + 4, sumY);
    doc.text(`Rs. ${currentOrder.deliveryCharge}`, summaryX + summaryW - 4, sumY, { align: 'right' });

    sumY += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(summaryX + 4, sumY, summaryX + summaryW - 4, sumY);

    sumY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(234, 88, 12); // brand orange
    doc.text('TOTAL PAID:', summaryX + 4, sumY);
    doc.text(`Rs. ${currentOrder.totalAmount}`, summaryX + summaryW - 4, sumY, { align: 'right' });

    y += 38;

    // ── 5. Clean Simple Footer ──
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Thank you for ordering with PJR Swagrooha Foods! We prepare every item fresh.', pageW / 2, y, { align: 'center' });

    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('For queries or special instructions, WhatsApp / Call: +91 8125154114 | Hayathnagar - Ibrahimpatnam', pageW / 2, y, { align: 'center' });

    doc.save(`PJR-Swagrooha-Invoice-${currentOrder.orderId}.pdf`);
  };

  if (!currentOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Active Order Found</h2>
        <button
          onClick={() => setActiveTab('products')}
          className="bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
        >
          Go to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl text-center space-y-3">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Order Placed & Sent via WhatsApp! 🎉
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
          Order ID: <strong className="bg-white/20 px-2 py-0.5 rounded font-mono text-white">{currentOrder.orderId}</strong>
        </p>
        {/* PDF Download Button inside banner */}
        <button
          onClick={handleDownloadInvoice}
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all mx-auto mt-2"
        >
          <Download className="w-4 h-4" />
          Download Invoice PDF
        </button>
      </div>

      {/* AUTO-DISPATCHED NOTIFICATIONS TO OWNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* ORDER CONFIRMED CARD */}
        <div className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-300 shadow-md text-center space-y-3">
          <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
            <PackageCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              ✅ Order Logged
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm">Order Registered & Verified</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your order has been logged. Track anytime using Order ID <strong className="text-blue-800 font-mono">{currentOrder.orderId}</strong>.
            </p>
          </div>
        </div>

        {/* OWNER AUTO-NOTIFICATION CARD */}
        <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-300 shadow-md text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              ✅ Auto-Dispatched
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm">Owner Alerted (+91 8125154114)</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Order receipt automatically sent to <strong>PJR Swagrooha Foods</strong> for processing.
            </p>
          </div>
        </div>

      </div>

      {/* Order Receipt Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-swiggy border border-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Order Summary</h3>
            <p className="text-xs text-slate-400">PJR Swagrooha Foods • Scheduled Homemade Delivery</p>
          </div>
          <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-lg">
            Delivery: {currentOrder.deliveryDate.dayOfWeekName}
          </span>
        </div>

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Customer Details</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{currentOrder.customer.name}</p>
            <p className="text-slate-600 font-medium">📞 {currentOrder.customer.phone}</p>
            <p className="text-blue-700 font-medium">✉️ {currentOrder.customer.email || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Delivery Route & Address</span>
            <p className="font-bold text-brand-600 text-xs mt-0.5">{currentOrder.area.name} Zone</p>
            <p className="text-slate-700 leading-relaxed font-medium">{currentOrder.customer.address}</p>
            <p className="text-amber-700 font-bold text-xs mt-1">
              📅 {currentOrder.deliveryDate.formattedDate}
            </p>
          </div>
        </div>

        {/* Verification Status Badge */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-950 block">Payment Confirmed ✅</span>
              <span className="text-emerald-800 text-[11px]">Payment Mode: <strong>Direct UPI Payment</strong></span>
            </div>
          </div>
          <span className="bg-emerald-200 text-emerald-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full shrink-0">
            Paid via UPI ✅
          </span>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Items Ordered</h4>
          <div className="divide-y divide-slate-100 text-xs">
            {currentOrder.items.map(item => (
              <div key={item.cartItemId} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{item.product.name}</span>
                  <span className="ml-2 text-slate-500 font-semibold">({item.selectedWeightLabel}) × {item.quantity}</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown Totals */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Items Total</span>
            <span className="font-bold text-slate-900">₹{currentOrder.subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Charge ({currentOrder.area.name})</span>
            <span className="font-bold text-slate-900">₹{currentOrder.deliveryCharge}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-black text-lg pt-2 border-t border-slate-200">
            <span>Total Amount Paid</span>
            <span className="text-brand-600">₹{currentOrder.totalAmount}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md"
          >
            <Download className="w-4 h-4" />
            Download Invoice PDF
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Place Another Order
          </button>
        </div>

      </div>

    </div>
  );
};
