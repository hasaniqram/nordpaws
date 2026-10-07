export type Product = {
  id: string
  slug: string
  name: string
  subtitle: string
  description: string
  category: 'Clean Home' | 'Travel' | 'Dogs' | 'Cats'
  price: number
  compareAt?: number
  badge?: string
  emoji: string
  gradient: string
  features: string[]
}

export const products: Product[] = [
  {
    id: 'np-cleanroll', slug: 'cleanroll', name: 'CleanRoll™', subtitle: 'Reusable pet-hair remover',
    description: 'A simple reusable roller designed to lift pet hair from sofas, bedding, car seats and clothing without sticky refills.',
    category: 'Clean Home', price: 32900, compareAt: 39900, badge: 'Bestseller', emoji: '🛋️',
    gradient: 'linear-gradient(135deg,#ece8df,#d8d3c8)',
    features: ['No batteries', 'No sticky refills', 'Reusable collection chamber', 'Made for daily use']
  },
  {
    id: 'np-pawcup', slug: 'paw-cleaner', name: 'PawClean Cup', subtitle: 'Mud off. Floors clean.',
    description: 'Soft silicone bristles gently clean muddy paws after wet walks, before your pet steps back inside.',
    category: 'Clean Home', price: 17900, compareAt: 21900, badge: 'Popular', emoji: '🐾',
    gradient: 'linear-gradient(135deg,#e7efe9,#cddfd2)',
    features: ['Soft silicone bristles', 'Easy rinse design', 'Travel friendly', 'Multiple paw sizes']
  },
  {
    id: 'np-travel-bowl', slug: 'fold-bowl', name: 'FoldBowl Duo', subtitle: 'Compact food & water bowls',
    description: 'Two collapsible bowls that pack flat for walks, road trips and weekends away.',
    category: 'Travel', price: 24900, badge: 'Travel pick', emoji: '🥣',
    gradient: 'linear-gradient(135deg,#e8edf2,#d5dde6)',
    features: ['Two-bowl set', 'Collapsible', 'Clip-on carry loop', 'Easy to wash']
  },
  {
    id: 'np-carcover', slug: 'car-seat-cover', name: 'RoadNest™', subtitle: 'Back-seat protector for dogs',
    description: 'A quilted seat protector designed to reduce fur, mud and scratches during everyday drives and weekend trips.',
    category: 'Travel', price: 59900, compareAt: 69900, badge: 'New', emoji: '🚗',
    gradient: 'linear-gradient(135deg,#e7e4e0,#cec8c1)',
    features: ['Quilted surface', 'Seat-anchor straps', 'Water-resistant layer', 'Fast install']
  },
  {
    id: 'np-slowfeed', slug: 'slow-feeder', name: 'CalmBite Bowl', subtitle: 'Slow feeder for calmer meals',
    description: 'A textured feeding bowl that encourages slower eating and turns mealtime into gentle enrichment.',
    category: 'Dogs', price: 22900, emoji: '🐕',
    gradient: 'linear-gradient(135deg,#efe7dc,#dfccb4)',
    features: ['Slow-feed maze', 'Non-slip base', 'Easy clean', 'Daily enrichment']
  },
  {
    id: 'np-groom', slug: 'grooming-brush', name: 'SoftGroom Brush', subtitle: 'Comfortable daily grooming',
    description: 'Rounded grooming pins help collect loose fur while keeping brushing comfortable for cats and small dogs.',
    category: 'Cats', price: 19900, emoji: '🐈',
    gradient: 'linear-gradient(135deg,#eee8f1,#d9cfdf)',
    features: ['Rounded pins', 'Easy-clean button', 'Comfort grip', 'For cats & small dogs']
  }
]

export const formatSEK = (ore: number) => new Intl.NumberFormat('sv-SE', {
  style: 'currency', currency: 'SEK', maximumFractionDigits: 0
}).format(ore / 100)
