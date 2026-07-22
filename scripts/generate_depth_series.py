import csv, json, os
from collections import defaultdict

def generate_ticker_depth(ticker):
    order_file = f'/home/ubuntu/handoff/output/orderbook/2026-07-22/{ticker}/full/order_detail.csv'
    if not os.path.exists(order_file):
        return
        
    orders = []
    with open(order_file) as f:
        reader = csv.DictReader(f)
        for row in reader:
            orders.append({'t': row['time'], 'p': int(float(row['price'])), 'bs': row['bs'], 'lot': int(float(row['opn'])), 'brk': row['brk']})

    orders.sort(key=lambda o: (o['t'], o['p']))

    times = sorted(set(o['t'] for o in orders))
    prices = sorted(set(o['p'] for o in orders))
    price_idx = {p: i for i, p in enumerate(prices)}
    num_prices = len(prices)

    time_order_map = defaultdict(list)
    for o in orders:
        time_order_map[o['t']].append(o)

    bid_state = [0] * num_prices
    offer_state = [0] * num_prices
    bid_brk_sets = defaultdict(set)
    offer_brk_sets = defaultdict(set)

    snapshots = []
    for t in times:
        d_b = {}
        d_o = {}
        for o in time_order_map[t]:
            pi = price_idx[o['p']]
            if o['bs'] == 'B':
                bid_state[pi] += o['lot']
                d_b[str(pi)] = bid_state[pi]
                if o['brk'] != '--': bid_brk_sets[pi].add(o['brk'])
            else:
                offer_state[pi] += o['lot']
                d_o[str(pi)] = offer_state[pi]
                if o['brk'] != '--': offer_brk_sets[pi].add(o['brk'])
        snapshots.append({'b': d_b, 'o': d_o})

    out = {
        'times': times,
        'prices': prices,
        'snapshots': snapshots,
        'bk': {str(pi): sorted(list(bid_brk_sets[pi])) for pi in range(num_prices) if bid_brk_sets[pi]},
        'sk': {str(pi): sorted(list(offer_brk_sets[pi])) for pi in range(num_prices) if offer_brk_sets[pi]},
    }
    
    os.makedirs('public/data/depth_series', exist_ok=True)
    with open(f'public/data/depth_series/{ticker}.json', 'w') as f:
        json.dump(out, f, separators=(',', ':'))

# Process all tickers in output/orderbook/2026-07-22/
for ticker in os.listdir('/home/ubuntu/handoff/output/orderbook/2026-07-22/'):
    generate_ticker_depth(ticker)
