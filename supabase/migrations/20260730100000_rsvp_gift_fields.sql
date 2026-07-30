alter table public.rsvps
  add column gift_institution text check (char_length(gift_institution) <= 160),
  add column gift_amount numeric(10,2) check (gift_amount >= 0 and gift_amount <= 1000000);
