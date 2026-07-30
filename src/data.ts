import { Product, Branch } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'romance-pink-heart',
    name: 'Romance Pink Heart-Shaped',
    category: 'Cakes',
    priceMin: 18.00,
    description: 'A beautiful heart-shaped cake covered in pink buttercream roses, perfect for romantic celebrations.',
    image: 'https://images.unsplash.com/photo-1518047601542-79f18c655718?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Chocolate Fudge', 'Vanilla Sponge', 'Ribbon Layer', 'Strawberry Velvet'],
    weights: ['1.0 kg', '1.5 kg', '2.0 kg']
  },
  {
    id: 'two-tier-teddy-bear',
    name: 'Two-Tier Teddy Bear',
    category: 'Cakes',
    priceMin: 42.00,
    description: 'A delightful two-tier birthday cake adorned with cute handcrafted edible teddy bears and toy blocks.',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Vanilla Buttercream', 'Chocolate Ganache', 'Rainbow Ribbon'],
    weights: ['2.0 kg', '3.0 kg']
  },
  {
    id: 'mango-butterfly-bliss',
    name: 'Mango Butterfly Bliss',
    category: 'Cakes',
    priceMin: 12.00,
    description: 'Rich mango infused sponge topped with real mango compote and delicate decorative butterflies.',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Mango Delight', 'Classic Vanilla'],
    weights: ['1.0 kg', '1.5 kg']
  },
  {
    id: 'black-forest-classic',
    name: 'Black Forest Classic',
    category: 'Cakes',
    priceMin: 12.00,
    description: 'Traditional German Black Forest cake with layers of chocolate sponge, whipped cream, and sour cherries.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Classic Dark Chocolate', 'Premium Kirsch-infused Chocolate'],
    weights: ['1.0 kg', '1.5 kg', '2.0 kg']
  },
  {
    id: 'strawberry-jam-delight',
    name: 'Strawberry Jam Delight',
    category: 'Cakes',
    priceMin: 12.00,
    description: 'Delicious vanilla layers filled with sweet premium strawberry compote and coated with strawberry glaze.',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Vanilla & Jam', 'Strawberry Supreme'],
    weights: ['1.0 kg', '1.5 kg']
  },
  {
    id: 'ribbon-tower-cake',
    name: 'Ribbon Tower Cake',
    category: 'Cakes',
    priceMin: 26.35,
    priceMax: 31.00,
    description: 'Tall colorful ribbon cake layers stacked beautifully with delicious white chocolate frosting.',
    image: 'https://images.unsplash.com/photo-1558961317-5f241202dbec?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Traditional Ceylon Ribbon', 'Multi-Colored Sponge', 'Pastel Layer'],
    weights: ['1.5 kg', '2.0 kg', '2.5 kg']
  },
  {
    id: 'golden-star-structure-cake',
    name: 'Golden Star Structure Cake',
    category: 'Cakes',
    priceMin: 32.55,
    priceMax: 34.10,
    description: 'A striking structural cake finished with metallic gold stars, perfect for graduations or grand events.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Dark Chocolate Ganache', 'Mocha Buttercream', 'Red Velvet Gold'],
    weights: ['1.5 kg', '2.0 kg']
  },
  {
    id: 'fondant-black-and-white',
    name: 'Fondant Black & White Cake',
    category: 'Cakes',
    priceMin: 26.35,
    priceMax: 28.52,
    description: 'Monochrome magic. A stylish round cake covered in black and white fondant stripes or patterns. Chic and modern.',
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Rich Chocolate Fudge', 'Red Velvet', 'Marble Ribbon', 'Classic Vanilla'],
    weights: ['1.0 kg', '1.5 kg', '2.0 kg']
  },
  {
    id: 'chocolate-wheel-sponge',
    name: 'Chocolate Wheel Sponge Cake',
    category: 'Cakes',
    priceMin: 18.60,
    description: 'Soft chocolate sponge with piped wheel patterns in rich milk chocolate and vanilla cream.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Milk Chocolate', 'Dark Espresso', 'Hazelnut Praline'],
    weights: ['1.0 kg', '1.5 kg', '2.0 kg']
  },
  {
    id: 'chocolates-red-cherry',
    name: 'Chocolates Red Cherry',
    category: 'Cakes',
    priceMin: 13.02,
    description: 'Decadent chocolate cake glazed in rich mirror icing and finished with shiny candied red cherries.',
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&q=80&w=600',
    isCustomizable: true,
    cakeTypes: ['Double Chocolate Fudge', 'Chocolate Cherry Liqueur'],
    weights: ['1.0 kg', '1.5 kg']
  },

  // Buns
  {
    id: 'butter-bun',
    name: 'Premium Butter Bun',
    category: 'Buns',
    priceMin: 1.20,
    description: 'Soft, golden bakery bun stuffed with rich, creamy salted Ceylon butter and coated with sugar crystals.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'jam-bun',
    name: 'Sweet Fruit Jam Bun',
    category: 'Buns',
    priceMin: 1.00,
    description: 'Freshly baked soft roll filled with our signature mixed fruit jam and dusted with sweet powdered sugar.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'spicy-chicken-bun',
    name: 'Spicy Chicken Devilled Bun',
    category: 'Buns',
    priceMin: 1.80,
    description: 'Warm oven bun packed with a spicy, aromatic shredded chicken and onion filling cooked with local spices.',
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cinnamon-roll',
    name: 'Glazed Cinnamon Roll',
    category: 'Buns',
    priceMin: 2.20,
    description: 'Flaky yeast dough rolled with spicy cinnamon sugar and drizzled with a rich cream cheese glaze.',
    image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&q=80&w=600'
  },

  // Doughnuts
  {
    id: 'chocolate-sprinkles-donut',
    name: 'Chocolate Sprinkle Doughnut',
    category: 'Doughnuts',
    priceMin: 2.00,
    description: 'Soft ring doughnut dipped in rich Belgian chocolate glaze and topped with rainbow sprinkles.',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'strawberry-glazed-donut',
    name: 'Strawberry Glazed Ring',
    category: 'Doughnuts',
    priceMin: 1.80,
    description: 'Fluffy raised doughnut coated in a sweet real strawberry icing with white chocolate stripes.',
    image: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'caramel-custard-donut',
    name: 'Caramel Custard Filled',
    category: 'Doughnuts',
    priceMin: 2.50,
    description: 'Yeast doughnut filled with homemade vanilla custard and topped with sticky salted caramel drizzle.',
    image: 'https://images.unsplash.com/photo-1533930027531-e6bb9285b3a4?auto=format&fit=crop&q=80&w=600'
  },

  // Piece Cake
  {
    id: 'chocolate-piece',
    name: 'Chocolate Fudge Slice',
    category: 'Piece Cake',
    priceMin: 1.50,
    description: 'A rich single slice of our famous moist chocolate fudge cake coated with dark chocolate ganache.',
    image: 'https://images.unsplash.com/photo-1571115177098-24ec4209350a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'fruit-cake-piece',
    name: 'Rich Ceylon Fruit Cake Slice',
    category: 'Piece Cake',
    priceMin: 1.80,
    description: 'Traditional spiced fruit cake piece loaded with brandy-soaked plums, raisins, cherries, and orange peel.',
    image: 'https://images.unsplash.com/photo-1586985289688-ca9cf47d3e6e?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'red-velvet-piece',
    name: 'Red Velvet Cream Cheese Slice',
    category: 'Piece Cake',
    priceMin: 2.20,
    description: 'Vibrant red cocoa sponge layer slice filled and coated with silky smooth vanilla cream cheese frosting.',
    image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=600'
  },

  // Savories
  {
    id: 'egg-puff',
    name: 'Ceylon Spicy Egg Puff',
    category: 'Savories',
    priceMin: 1.00,
    description: 'Flaky. Golden. Irresistible. Crisp puff pastry stuffed with hard-boiled egg and a spicy caramelized onion sambal.',
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'fish-patty',
    name: 'Spiced Fish Patty',
    category: 'Savories',
    priceMin: 0.80,
    description: 'Golden fried shortcrust pastry filled with a savory mixture of mackerel, boiled potato, black pepper, and onions.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'chicken-samosa',
    name: 'Spicy Chicken Samosa',
    category: 'Savories',
    priceMin: 0.90,
    description: 'Pyramid pastry crust stuffed with aromatic minced chicken breast, green peas, and local curry powders.',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600'
  },

  // Sweets
  {
    id: 'milk-toffee',
    name: 'Traditional Milk Toffee',
    category: 'Sweets',
    priceMin: 0.50,
    description: 'Sweet, crumbly traditional Sri Lankan toffee made from condensed milk, sugar, butter, and crushed cashews.',
    image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'coconut-rock',
    name: 'Pink Coconut Rock',
    category: 'Sweets',
    priceMin: 0.40,
    description: 'A nostalgic sweet treat made of desiccated coconut, rose syrup, and caramelized sugar cooked to chewy perfection.',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600'
  }
];

export const BRANCHES: Branch[] = [
  {
    id: 'manipay',
    name: 'Manipay Branch',
    address: '180, Jaffna Rd, Manipay',
    phone: '021 225 5370',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'bastian',
    name: 'Bastian Branch',
    address: 'Bastian Junction',
    phone: '021 221 4959',
    image: 'https://images.unsplash.com/photo-1428515613728-6b4607e44363?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'chunnakam',
    name: 'Chunnakam Branch',
    address: 'Main Street, Chunnakam',
    phone: '021 224 4433',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'nelliady',
    name: 'Nelliady Branch',
    address: 'Main Street, Nelliady',
    phone: '021 226 4446',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'thirunvely',
    name: 'Thirunvely Branch',
    address: 'Palaly Road, Thirunvely',
    phone: '021 221 2525',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'wellawatte',
    name: 'Wellawatte Branch',
    address: 'Ramakrishna Road, Colombo 06',
    phone: '0112367876',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=600'
  }
];

export const MOCK_REVIEWS = [
  { author: 'Prabash K.', rating: 5, date: '2026-07-02', comment: 'Absolutely outstanding cake! Ordered this for my sister\'s birthday and everyone loved the Rich Chocolate Fudge taste. Highly recommended.' },
  { author: 'Niroshini T.', rating: 5, date: '2026-06-25', comment: 'Excellent presentation and the icing is incredibly delicious without being oversweet. The black and white fondant look was perfect.' },
  { author: 'Anura S.', rating: 4, date: '2026-06-10', comment: 'Very soft layers, arrived right on time at the Manipay branch. Great customer service.' }
];
