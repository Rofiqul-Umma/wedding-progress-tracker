import type { PlanState } from '@domain/entities/types';
import { uid } from '@application/use-cases/id';

/** The sample plan shown on first run / "Load sample plan". */
export function seed(): PlanState {
  const yr = new Date().getFullYear() + 1;
  const d = (m: number) => `${yr}-${String(m).padStart(2, '0')}`;
  return {
    settings: { currency: 'USD', lang: 'en' },
    wedding: {
      p1: 'Amara',
      p2: 'Julian',
      date: `${yr}-09-14`,
      venue: 'The Ivy Barn, Sonoma',
      budget: 42000,
    },
    vendors: [
      { id: uid(), name: 'The Ivy Barn', category: 'Venue', contact: 'Reneé Adler', phone: '(707) 555-0182', social: 'instagram.com/theivybarn', cost: 14500, status: 'paid', notes: 'Includes tables, chairs, and 11pm curfew.' },
      { id: uid(), name: 'Wildflower & Vine', category: 'Florals', contact: 'Mina Okafor', phone: '(415) 555-2231', social: 'instagram.com/wildflowervine', cost: 3800, status: 'booked', notes: 'Seasonal dahlias + ranunculus.' },
      { id: uid(), name: 'Golden Hour Films', category: 'Photography', contact: 'Theo Marsh', phone: '(510) 555-7744', social: 'instagram.com/goldenhourfilms', cost: 5200, status: 'booked', notes: '8 hrs coverage + engagement session.' },
      { id: uid(), name: 'Copper Spoon Catering', category: 'Catering', contact: 'Dev Patel', phone: '(707) 555-9910', social: 'instagram.com/copperspoon', cost: 9600, status: 'inquiry', notes: 'Tasting scheduled. Family-style menu.' },
      { id: uid(), name: 'Neon Meadow DJ', category: 'Music', contact: 'Sam Rivera', phone: '(408) 555-3320', social: 'instagram.com/neonmeadow', cost: 2200, status: 'booked', notes: 'Ceremony + reception.' },
    ],
    budget: [
      { id: uid(), category: 'Venue', item: 'Ivy Barn rental', estimated: 14500, actual: 14500, paid: true },
      { id: uid(), category: 'Catering', item: 'Dinner + service', estimated: 10000, actual: 9600, paid: false },
      { id: uid(), category: 'Photography', item: 'Golden Hour Films', estimated: 5000, actual: 5200, paid: false },
      { id: uid(), category: 'Florals', item: 'Wildflower & Vine', estimated: 4000, actual: 3800, paid: false },
      { id: uid(), category: 'Attire', item: 'Dress + suit + alterations', estimated: 3800, actual: 3400, paid: true },
      { id: uid(), category: 'Music', item: 'Neon Meadow DJ', estimated: 2200, actual: 2200, paid: false },
      { id: uid(), category: 'Stationery', item: 'Invites + signage', estimated: 1200, actual: 950, paid: true },
      { id: uid(), category: 'Cake', item: 'Three-tier + tasting', estimated: 900, actual: 0, paid: false },
    ],
    tasks: [
      { id: uid(), title: 'Send save-the-dates', due: `${d(3)}-15`, done: true, cat: 'Stationery', created: '09:05 AM' },
      { id: uid(), title: 'Book catering tasting', due: `${d(4)}-02`, done: false, cat: 'Catering', created: '10:20 AM' },
      { id: uid(), title: 'Order wedding bands', due: `${d(4)}-20`, done: false, cat: 'Attire', created: '08:45 AM', url: 'https://www.bluenile.com/wedding-rings' },
      { id: uid(), title: 'Finalize guest list', due: `${d(5)}-10`, done: false, cat: 'Planning', created: '11:30 AM' },
      { id: uid(), title: 'Send formal invitations', due: `${d(6)}-01`, done: false, cat: 'Stationery', created: '02:10 PM' },
      { id: uid(), title: 'First dress fitting', due: `${d(7)}-12`, done: false, cat: 'Attire', created: '09:50 AM' },
      { id: uid(), title: 'Confirm final headcount', due: `${d(8)}-14`, done: false, cat: 'Venue', created: '04:15 PM' },
    ],
    seserahan: [
      { id: uid(), name: 'Seperangkat alat sholat', category: 'Ibadah', qty: 1, cost: 0, status: 'finished', notes: 'Mukena, sajadah & Al-Qur’an' },
      { id: uid(), name: 'Kosmetik & skincare', category: 'Kecantikan', qty: 1, cost: 320, status: 'onProgress', notes: 'Full make-up + skincare set' },
      { id: uid(), name: 'Sepatu & sandal', category: 'Busana', qty: 2, cost: 180, status: 'pending', notes: '1 heels, 1 flat' },
      { id: uid(), name: 'Tas tangan', category: 'Aksesoris', qty: 1, cost: 140, status: 'finished', notes: 'Hand bag for daily use' },
      { id: uid(), name: 'Kebaya & batik', category: 'Busana', qty: 2, cost: 260, status: 'onProgress', notes: 'For the akad & reception' },
      { id: uid(), name: 'Parfum', category: 'Kecantikan', qty: 1, cost: 90, status: 'pending', notes: '' },
      { id: uid(), name: 'Buah-buahan segar', category: 'Makanan', qty: 1, cost: 40, status: 'pending', notes: 'Seasonal fruit arrangement' },
      { id: uid(), name: 'Perhiasan (cincin & kalung)', category: 'Aksesoris', qty: 1, cost: 0, status: 'pending', notes: 'Handled by the family' },
      { id: uid(), name: 'Kue tradisional', category: 'Makanan', qty: 1, cost: 55, status: 'finished', notes: 'Assorted traditional sweets' },
    ],
    shopping: [
      { id: uid(), name: 'String lights (10m)', category: 'Decor', store: 'Etsy — GlowCraft', price: 45, qty: 6, status: 'purchased', url: 'https://www.etsy.com/listing/string-lights', image: '', notes: 'Warm white, for the barn ceiling.' },
      { id: uid(), name: 'Guest favor candles', category: 'Favors', store: 'The Candle Co.', price: 4, qty: 80, status: 'ordered', url: 'https://thecandleco.example/favors', image: '', notes: 'Lavender + vanilla, kraft boxes.' },
      { id: uid(), name: 'Cake knife & server set', category: 'Attire', store: 'Amazon', price: 28, qty: 1, status: 'toBuy', url: '', image: '', notes: 'Gold, engraved optional.' },
      { id: uid(), name: 'Ring bearer pillow', category: 'Attire', store: 'Etsy — LinenLoom', price: 32, qty: 1, status: 'toBuy', url: 'https://www.etsy.com/listing/ring-pillow', image: '', notes: '' },
      { id: uid(), name: 'Table numbers (1–15)', category: 'Stationery', store: 'Local print shop', price: 3, qty: 15, status: 'ordered', url: '', image: '', notes: 'Acrylic, matching signage.' },
    ],
    contacts: [
      { id: uid(), name: 'Reneé Adler', role: 'Venue Coordinator', phone: '(707) 555-0182', social: 'instagram.com/ivybarnvenue', notes: 'Best reached mornings. Handles day-of logistics.' },
      { id: uid(), name: 'Pastor Elena Cruz', role: 'Officiant', phone: '(707) 555-6621', social: 'instagram.com/pastorelena', notes: 'Rehearsal the evening before at 5pm.' },
      { id: uid(), name: 'Mom (Diane)', role: 'Family / Helper', phone: '(707) 555-0043', social: 'tiktok.com/@dianehelps', notes: 'Coordinating the rehearsal dinner.' },
    ],
  };
}
