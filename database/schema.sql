-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  wallet_balance numeric default 0,
  role text default 'USER', -- 'USER', 'ADMIN', 'SUPER_ADMIN'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- CATEGORIES
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  icon text, -- Lucide icon name or image URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SHOPS
create table public.shops (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  nif text,
  description text,
  logo text,
  category text,
  phone text,
  is_verified boolean default false,
  verified_at timestamp with time zone,
  status text default 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for shops
alter table public.shops enable row level security;

create policy "Shops are viewable by everyone."
  on shops for select
  using ( true );

create policy "Users can create their own shop."
  on shops for insert
  with check ( auth.uid() = owner_id );

create policy "Owners can update their own shop."
  on shops for update
  using ( auth.uid() = owner_id );

-- PRODUCTS
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  category_id uuid references public.categories(id),
  category text, -- Added for simplified category management as seen in frontend
  name text not null,
  description text,
  price numeric not null,
  old_price numeric,
  image text, -- Main image URL
  gallery text[], -- Array of image URLs
  rating numeric default 0,
  sales integer default 0,
  is_international boolean default false,
  is_flash_deal boolean default false, -- Added for HomeScreen deals
  status text default 'PENDENTE', -- Added: 'PENDENTE', 'PUBLICADO', 'REJEITADO'
  location text, -- Added for delivery location
  variations jsonb, -- JSONB to store flexible variations like { "Color": ["Red", "Blue"] }
  stock integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for products
alter table public.products enable row level security;

create policy "Products are viewable by everyone."
  on products for select
  using ( true );

create policy "Sellers can insert their own products."
  on products for insert
  with check ( auth.uid() = seller_id );

create policy "Sellers can update their own products."
  on products for update
  using ( auth.uid() = seller_id );

-- ORDERS
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  total numeric not null,
  status text default 'PENDING', -- 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDER ITEMS
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  price numeric not null, -- Price at time of purchase
  variations jsonb -- Selected variations
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, wallet_balance)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_user_meta_data->>'role', 'USER'),
    coalesce((new.raw_user_meta_data->>'wallet_balance')::numeric, 0)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC Function to rotate flash deals (Simulated logic for AngoPlaceMarket)
create or replace function public.rotate_flash_deals()
returns void as $$
begin
  -- Clear current flash deals
  update public.products set is_flash_deal = false;
  
  -- Randomly select 8 products to be flash deals
  update public.products
  set is_flash_deal = true,
      old_price = price * 1.2 -- Simulate original price
  where id in (
    select id from public.products 
    where status = 'PUBLICADO'
    order by random() 
    limit 8
  );
end;
$$ language plpgsql security definer;
