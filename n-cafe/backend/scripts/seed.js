const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const CafeSettings = require('../models/CafeSettings');
const ActivityLog = require('../models/ActivityLog');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      InventoryItem.deleteMany({}),
      Customer.deleteMany({}),
      Order.deleteMany({}),
      CafeSettings.deleteMany({}),
      ActivityLog.deleteMany({})
    ]);

    // 1. Create Cafe Settings
    console.log('[Seed] Creating Café Settings...');
    const settings = await CafeSettings.create({
      cafeName: 'N CAFÉ',
      tagline: 'Artisan Brews & Gourmet Moments',
      address: 'Plot 42, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
      phone: '+91 98765 43210',
      email: 'contact@ncafe.in',
      currency: 'INR',
      currencySymbol: '₹',
      taxRate: 5,
      orderPrefix: 'NC-'
    });

    // 2. Create Users (Admin & Staff)
    console.log('[Seed] Creating Users...');
    const adminUser = await User.create({
      name: 'Arjun Sharma',
      email: 'admin@ncafe.com',
      password: 'admin123',
      role: 'admin',
      jobRole: 'Café General Manager',
      phone: '+91 98765 00001',
      status: 'active'
    });

    const staffUser1 = await User.create({
      name: 'Priya Nair',
      email: 'staff@ncafe.com',
      password: 'staff123',
      role: 'staff',
      jobRole: 'Head Barista',
      phone: '+91 98765 00002',
      status: 'active'
    });

    const staffUser2 = await User.create({
      name: 'Rahul Verma',
      email: 'cashier@ncafe.com',
      password: 'cashier123',
      role: 'staff',
      jobRole: 'Cashier & Front Desk',
      phone: '+91 98765 00003',
      status: 'active'
    });

    // 3. Create Categories
    console.log('[Seed] Creating Categories...');
    const categoryData = [
      { name: 'Coffee', description: 'Handcrafted espresso, pourovers and specialty iced coffees', icon: 'Coffee', displayOrder: 1 },
      { name: 'Tea', description: 'Artisanal single-estate leaves, masala chai and ceremonial matcha', icon: 'CupSoda', displayOrder: 2 },
      { name: 'Cold Beverages', description: 'Refreshing sparklers, iced coolers and creamy frappés', icon: 'GlassWater', displayOrder: 3 },
      { name: 'Snacks', description: 'Crunchy savory bites, artisanal fries and puffs', icon: 'Utensils', displayOrder: 4 },
      { name: 'Sandwiches', description: 'Toasted gourmet sourdough sandwiches and grilled paninis', icon: 'Sandwich', displayOrder: 5 },
      { name: 'Desserts', description: 'Freshly baked pastries, warm brownies and decadence', icon: 'Cake', displayOrder: 6 },
      { name: 'Special Items', description: 'Chef signature seasonal creations and rare delicacies', icon: 'Sparkles', displayOrder: 7 }
    ];

    const categories = await Category.insertMany(categoryData);
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.name] = c._id; });

    // 4. Create Menu Items
    console.log('[Seed] Creating Menu Items...');
    const menuData = [
      {
        name: 'Signature Espresso Double',
        description: 'Rich, full-bodied double shot with velvet crema, using single-origin Chikmagalur Arabica beans.',
        price: 140,
        category: categoryMap['Coffee'],
        categoryName: 'Coffee',
        image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 4,
        dietary: 'Vegan',
        isPopular: true,
        salesCount: 42
      },
      {
        name: 'Classic Velvet Cappuccino',
        description: 'Equal parts espresso, silky steamed milk, and dense micro-foam dusted with organic cocoa powder.',
        price: 210,
        category: categoryMap['Coffee'],
        categoryName: 'Coffee',
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 5,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 88
      },
      {
        name: 'Caramel Macchiato',
        description: 'Freshly steamed milk with vanilla-infused syrup, marked with espresso and drizzled with caramel.',
        price: 260,
        category: categoryMap['Coffee'],
        categoryName: 'Coffee',
        image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 6,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 65
      },
      {
        name: 'Hazelnut Cream Latte',
        description: 'Slow-brewed espresso blended with toasted hazelnut syrup and smooth whole milk.',
        price: 250,
        category: categoryMap['Coffee'],
        categoryName: 'Coffee',
        image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 5,
        dietary: 'Veg',
        isPopular: false,
        salesCount: 37
      },
      {
        name: 'Cold Brew Reserve (16 hrs)',
        description: 'Steeped for 16 hours cold-drip method. Exceptionally smooth, naturally sweet with low acidity.',
        price: 230,
        category: categoryMap['Coffee'],
        categoryName: 'Coffee',
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 3,
        dietary: 'Vegan',
        isPopular: true,
        salesCount: 54
      },
      {
        name: 'Artisan Masala Chai',
        description: 'Brewed with crushed ginger, green cardamom, cloves, cinnamon, and organic Assam CTC leaves.',
        price: 120,
        category: categoryMap['Tea'],
        categoryName: 'Tea',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 6,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 79
      },
      {
        name: 'Uji Matcha Green Tea Latte',
        description: 'First harvest ceremonial matcha from Kyoto, whisked to perfection with creamy oat milk.',
        price: 280,
        category: categoryMap['Tea'],
        categoryName: 'Tea',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 5,
        dietary: 'Vegan',
        isPopular: true,
        salesCount: 46
      },
      {
        name: 'Classic Lemon Mint Iced Tea',
        description: 'House-steeped Darjeeling black tea, fresh mint leaves, squeezed lemon juice and raw honey.',
        price: 180,
        category: categoryMap['Cold Beverages'],
        categoryName: 'Cold Beverages',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 4,
        dietary: 'Vegan',
        isPopular: false,
        salesCount: 29
      },
      {
        name: 'Dark Chocolate Mocha Frappé',
        description: 'Decadent Belgian chocolate, espresso, crushed ice and whipped cream topping with cocoa crispies.',
        price: 290,
        category: categoryMap['Cold Beverages'],
        categoryName: 'Cold Beverages',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 7,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 58
      },
      {
        name: 'Peri-Peri Crinkle Cut Fries',
        description: 'Golden crisp crinkle cut potato fries tossed in aromatic African peri-peri herb dust, served with garlic dip.',
        price: 210,
        category: categoryMap['Snacks'],
        categoryName: 'Snacks',
        image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 10,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 62
      },
      {
        name: 'Butter Croissant French Artisan',
        description: 'Flaky, buttery, laminated layers prepared with pure butter and golden-baked fresh every morning.',
        price: 160,
        category: categoryMap['Snacks'],
        categoryName: 'Snacks',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 2,
        dietary: 'Veg',
        isPopular: false,
        salesCount: 35
      },
      {
        name: 'Grilled Paneer Tikka Panini',
        description: 'Tandoori spiced cottage cheese cubes, grilled peppers, mint chutney and melted mozzarella in herb focaccia.',
        price: 240,
        category: categoryMap['Sandwiches'],
        categoryName: 'Sandwiches',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 12,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 71
      },
      {
        name: 'Smoked Chicken & Bacon Club',
        description: 'Tender smoked chicken breast, crispy bacon, fried egg, lettuce, vine tomatoes and dijon mayo on sourdough.',
        price: 290,
        category: categoryMap['Sandwiches'],
        categoryName: 'Sandwiches',
        image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 14,
        dietary: 'Non-Veg',
        isPopular: true,
        salesCount: 49
      },
      {
        name: 'Avocado & Sun-Dried Tomato Toast',
        description: 'Mashed Hass avocado on toasted artisanal sourdough, cherry tomatoes, pumpkin seeds, and balsamic glaze.',
        price: 310,
        category: categoryMap['Sandwiches'],
        categoryName: 'Sandwiches',
        image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 8,
        dietary: 'Vegan',
        isPopular: false,
        salesCount: 28
      },
      {
        name: 'Classic Espresso Tiramisu',
        description: 'Savoiardi ladyfingers soaked in our signature espresso, layered with whipped mascarpone cream and Valrhona cocoa.',
        price: 280,
        category: categoryMap['Desserts'],
        categoryName: 'Desserts',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 3,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 53
      },
      {
        name: 'Warm Belgian Chocolate Brownie',
        description: 'Gooey dark chocolate brownie served with a scoop of Madagascar vanilla bean gelato and warm chocolate ganache.',
        price: 240,
        category: categoryMap['Desserts'],
        categoryName: 'Desserts',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 4,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 66
      },
      {
        name: 'N CAFÉ Royal Saffron Pistachio Latte',
        description: 'Kashmiri saffron strands infused with roasted Iranian pistachios and velvety condensed steamed milk.',
        price: 340,
        category: categoryMap['Special Items'],
        categoryName: 'Special Items',
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTime: 7,
        dietary: 'Veg',
        isPopular: true,
        salesCount: 38
      }
    ];

    const menuItems = await MenuItem.insertMany(menuData);

    // 5. Create Inventory Ingredients
    console.log('[Seed] Creating Inventory Ingredients...');
    const inventoryData = [
      { name: 'Arabica Single-Origin Beans', quantity: 18.5, unit: 'kg', minStockLevel: 6, supplier: 'Chikmagalur Estates', supplierContact: '+91 99001 12233', purchasePrice: 1350 },
      { name: 'Robusta Blend Beans', quantity: 2.2, unit: 'kg', minStockLevel: 5, supplier: 'Coorg Planters Co.', supplierContact: '+91 99002 23344', purchasePrice: 850 }, // LOW STOCK!
      { name: 'Full Cream Farm Fresh Milk', quantity: 38.0, unit: 'L', minStockLevel: 12, supplier: 'Nandini Dairy Special', supplierContact: '+91 99003 34455', purchasePrice: 62 },
      { name: 'Oatly Barista Oat Milk', quantity: 3.0, unit: 'L', minStockLevel: 6, supplier: 'Urban Gourmet Distributors', supplierContact: '+91 99004 45566', purchasePrice: 280 }, // LOW STOCK!
      { name: 'Ceremonial Matcha Green Powder', quantity: 0.6, unit: 'kg', minStockLevel: 1.0, supplier: 'Kyoto Tea Imports', supplierContact: '+91 99005 56677', purchasePrice: 3400 }, // LOW STOCK!
      { name: 'Assam CTC & Orthodox Tea Blend', quantity: 8.0, unit: 'kg', minStockLevel: 3, supplier: 'Guwahati Tea Auction', supplierContact: '+91 99006 67788', purchasePrice: 520 },
      { name: 'Belgian Dark Chocolate Callets 70%', quantity: 6.5, unit: 'kg', minStockLevel: 3, supplier: 'Callebaut India', supplierContact: '+91 99007 78899', purchasePrice: 1150 },
      { name: 'Fresh Artisan Paneer', quantity: 7.0, unit: 'kg', minStockLevel: 3, supplier: 'Local Fresh Dairy', supplierContact: '+91 99008 89900', purchasePrice: 380 },
      { name: 'Crinkle Cut French Fries Frozen', quantity: 12.0, unit: 'kg', minStockLevel: 5, supplier: 'McCain Foodservice', supplierContact: '+91 99009 90011', purchasePrice: 190 },
      { name: 'Sourdough Bread Loaves', quantity: 14, unit: 'pcs', minStockLevel: 6, supplier: 'Crust & Crumb Bakery', supplierContact: '+91 99010 01122', purchasePrice: 95 },
      { name: 'Salted Caramel Syrup (Monin)', quantity: 2, unit: 'bottles', minStockLevel: 3, supplier: 'Monin India Direct', supplierContact: '+91 99011 12233', purchasePrice: 780 }, // LOW STOCK!
      { name: 'Hass Avocados (Fresh)', quantity: 18, unit: 'pcs', minStockLevel: 8, supplier: 'Nilgiri Exotic Farms', supplierContact: '+91 99012 23344', purchasePrice: 65 }
    ];

    await InventoryItem.insertMany(inventoryData);

    // 6. Create Customers
    console.log('[Seed] Creating Customers...');
    const customerData = [
      { name: 'Rohan Gupta', phone: '+91 98111 22334', email: 'rohan.gupta@techcorp.in', totalOrders: 5, totalSpent: 2640, lastOrderDate: new Date() },
      { name: 'Ananya Sen', phone: '+91 98222 33445', email: 'ananya.sen@designstudio.com', totalOrders: 8, totalSpent: 4210, lastOrderDate: new Date() },
      { name: 'Vikram Malhotra', phone: '+91 98333 44556', email: 'vikram.m@fintech.co', totalOrders: 4, totalSpent: 1920, lastOrderDate: new Date(Date.now() - 86400000) },
      { name: 'Sneha Patel', phone: '+91 98444 55667', email: 'sneha.patel@creative.net', totalOrders: 6, totalSpent: 3150, lastOrderDate: new Date(Date.now() - 2 * 86400000) },
      { name: 'Kabir Kapoor', phone: '+91 98555 66778', email: 'kabir.k@startup.io', totalOrders: 3, totalSpent: 1470, lastOrderDate: new Date(Date.now() - 3 * 86400000) }
    ];

    const customers = await Customer.insertMany(customerData);

    // 7. Create Orders across multiple days for rich dashboard charts
    console.log('[Seed] Creating Historical and Active Orders...');
    const now = new Date();
    const ordersToInsert = [];

    // Helper to generate an order
    const makeOrder = (seq, daysAgo, status, paymentMethod, paymentStatus, customerObj, itemsArr) => {
      const orderDate = new Date(now);
      orderDate.setDate(now.getDate() - daysAgo);
      orderDate.setHours(10 + (seq % 10), (seq * 13) % 60, 0, 0);

      let subtotal = 0;
      const orderItems = itemsArr.map(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        return {
          menuItem: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          notes: ''
        };
      });

      const tax = Math.round((subtotal * 0.05) * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      return {
        orderNumber: `NC-${seq}`,
        customer: {
          customerId: customerObj ? customerObj._id : null,
          name: customerObj ? customerObj.name : 'Walk-in Customer',
          phone: customerObj ? customerObj.phone : '+91 98000 00000',
          email: customerObj ? customerObj.email : ''
        },
        items: orderItems,
        subtotal,
        discount: 0,
        discountType: 'fixed',
        tax,
        taxRate: 5,
        total,
        paymentMethod,
        paymentStatus,
        status,
        cancellationReason: status === 'Cancelled' ? 'Customer had an urgent meeting' : '',
        createdBy: adminUser._id,
        createdByName: 'Arjun Sharma',
        createdAt: orderDate,
        updatedAt: orderDate,
        completedAt: status === 'Completed' ? orderDate : null
      };
    };

    // Past 7 days historical orders
    let orderSeq = 1001;

    // Day 6 ago
    ordersToInsert.push(makeOrder(orderSeq++, 6, 'Completed', 'UPI', 'Paid', customers[0], [
      { _id: menuItems[1]._id, name: menuItems[1].name, price: menuItems[1].price, quantity: 2 },
      { _id: menuItems[10]._id, name: menuItems[10].name, price: menuItems[10].price, quantity: 1 }
    ]));
    ordersToInsert.push(makeOrder(orderSeq++, 6, 'Completed', 'Card', 'Paid', customers[1], [
      { _id: menuItems[2]._id, name: menuItems[2].name, price: menuItems[2].price, quantity: 1 },
      { _id: menuItems[14]._id, name: menuItems[14].name, price: menuItems[14].price, quantity: 1 }
    ]));

    // Day 5 ago
    ordersToInsert.push(makeOrder(orderSeq++, 5, 'Completed', 'UPI', 'Paid', customers[2], [
      { _id: menuItems[11]._id, name: menuItems[11].name, price: menuItems[11].price, quantity: 2 },
      { _id: menuItems[5]._id, name: menuItems[5].name, price: menuItems[5].price, quantity: 2 }
    ]));
    ordersToInsert.push(makeOrder(orderSeq++, 5, 'Completed', 'Cash', 'Paid', null, [
      { _id: menuItems[0]._id, name: menuItems[0].name, price: menuItems[0].price, quantity: 1 },
      { _id: menuItems[9]._id, name: menuItems[9].name, price: menuItems[9].price, quantity: 1 }
    ]));

    // Day 4 ago
    ordersToInsert.push(makeOrder(orderSeq++, 4, 'Completed', 'UPI', 'Paid', customers[3], [
      { _id: menuItems[6]._id, name: menuItems[6].name, price: menuItems[6].price, quantity: 1 },
      { _id: menuItems[15]._id, name: menuItems[15].name, price: menuItems[15].price, quantity: 1 }
    ]));
    ordersToInsert.push(makeOrder(orderSeq++, 4, 'Cancelled', 'UPI', 'Refunded', null, [
      { _id: menuItems[12]._id, name: menuItems[12].name, price: menuItems[12].price, quantity: 2 }
    ]));

    // Day 3 ago
    ordersToInsert.push(makeOrder(orderSeq++, 3, 'Completed', 'Card', 'Paid', customers[4], [
      { _id: menuItems[4]._id, name: menuItems[4].name, price: menuItems[4].price, quantity: 2 },
      { _id: menuItems[13]._id, name: menuItems[13].name, price: menuItems[13].price, quantity: 1 }
    ]));
    ordersToInsert.push(makeOrder(orderSeq++, 3, 'Completed', 'UPI', 'Paid', customers[0], [
      { _id: menuItems[16]._id, name: menuItems[16].name, price: menuItems[16].price, quantity: 1 },
      { _id: menuItems[14]._id, name: menuItems[14].name, price: menuItems[14].price, quantity: 1 }
    ]));

    // Day 2 ago
    ordersToInsert.push(makeOrder(orderSeq++, 2, 'Completed', 'Cash', 'Paid', null, [
      { _id: menuItems[1]._id, name: menuItems[1].name, price: menuItems[1].price, quantity: 3 },
      { _id: menuItems[9]._id, name: menuItems[9].name, price: menuItems[9].price, quantity: 2 }
    ]));
    ordersToInsert.push(makeOrder(orderSeq++, 2, 'Completed', 'UPI', 'Paid', customers[1], [
      { _id: menuItems[8]._id, name: menuItems[8].name, price: menuItems[8].price, quantity: 2 }
    ]));

    // Yesterday
    ordersToInsert.push(makeOrder(orderSeq++, 1, 'Completed', 'Card', 'Paid', customers[2], [
      { _id: menuItems[11]._id, name: menuItems[11].name, price: menuItems[11].price, quantity: 1 },
      { _id: menuItems[1]._id, name: menuItems[1].name, price: menuItems[1].price, quantity: 1 },
      { _id: menuItems[15]._id, name: menuItems[15].name, price: menuItems[15].price, quantity: 1 }
    ]));
    ordersToInsert.push(makeOrder(orderSeq++, 1, 'Completed', 'UPI', 'Paid', customers[3], [
      { _id: menuItems[6]._id, name: menuItems[6].name, price: menuItems[6].price, quantity: 2 },
      { _id: menuItems[10]._id, name: menuItems[10].name, price: menuItems[10].price, quantity: 2 }
    ]));

    // TODAY Orders (Completed, Ready, Preparing, Pending)
    ordersToInsert.push(makeOrder(orderSeq++, 0, 'Completed', 'UPI', 'Paid', customers[0], [
      { _id: menuItems[1]._id, name: menuItems[1].name, price: menuItems[1].price, quantity: 2 },
      { _id: menuItems[11]._id, name: menuItems[11].name, price: menuItems[11].price, quantity: 1 }
    ]));

    ordersToInsert.push(makeOrder(orderSeq++, 0, 'Completed', 'Card', 'Paid', customers[4], [
      { _id: menuItems[2]._id, name: menuItems[2].name, price: menuItems[2].price, quantity: 1 },
      { _id: menuItems[15]._id, name: menuItems[15].name, price: menuItems[15].price, quantity: 1 }
    ]));

    ordersToInsert.push(makeOrder(orderSeq++, 0, 'Ready', 'UPI', 'Paid', customers[1], [
      { _id: menuItems[4]._id, name: menuItems[4].name, price: menuItems[4].price, quantity: 1 },
      { _id: menuItems[12]._id, name: menuItems[12].name, price: menuItems[12].price, quantity: 1 }
    ]));

    ordersToInsert.push(makeOrder(orderSeq++, 0, 'Preparing', 'Cash', 'Unpaid', null, [
      { _id: menuItems[5]._id, name: menuItems[5].name, price: menuItems[5].price, quantity: 2 },
      { _id: menuItems[9]._id, name: menuItems[9].name, price: menuItems[9].price, quantity: 1 }
    ]));

    ordersToInsert.push(makeOrder(orderSeq++, 0, 'Pending', 'UPI', 'Paid', customers[3], [
      { _id: menuItems[16]._id, name: menuItems[16].name, price: menuItems[16].price, quantity: 1 },
      { _id: menuItems[14]._id, name: menuItems[14].name, price: menuItems[14].price, quantity: 1 }
    ]));

    await Order.insertMany(ordersToInsert);

    // 8. Create Activity Logs
    console.log('[Seed] Creating Activity Logs...');
    const activityData = [
      { user: adminUser._id, userName: adminUser.name, action: 'Initial café database seeded and configured', category: 'settings' },
      { user: adminUser._id, userName: adminUser.name, action: 'Updated menu item: N CAFÉ Royal Saffron Pistachio Latte', category: 'menu' },
      { user: staffUser1._id, userName: staffUser1.name, action: 'Restocked Arabica Single-Origin Beans (10 kg)', category: 'inventory' },
      { user: staffUser2._id, userName: staffUser2.name, action: 'Created Order #NC-1014 (₹693)', category: 'order' },
      { user: staffUser1._id, userName: staffUser1.name, action: 'Order #NC-1015 status changed to Ready', category: 'order' },
      { user: adminUser._id, userName: adminUser.name, action: 'Arjun Sharma logged in (admin)', category: 'auth' }
    ];

    await ActivityLog.insertMany(activityData);

    console.log('----------------------------------------------------');
    console.log('☕ [Seed] N CAFÉ Database Successfully Seeded!');
    console.log('----------------------------------------------------');
    console.log('Admin Credentials:');
    console.log('  Email:    admin@ncafe.com');
    console.log('  Password: admin123');
    console.log('Staff Credentials:');
    console.log('  Email:    staff@ncafe.com');
    console.log('  Password: staff123');
    console.log('Cashier Credentials:');
    console.log('  Email:    cashier@ncafe.com');
    console.log('  Password: cashier123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();
