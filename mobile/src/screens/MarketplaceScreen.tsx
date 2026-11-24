import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import type { Listing, ListingFilters } from '../types/listing';
import { useListings } from '../hooks/useListings';
import { FALLBACK_COMMODITIES, referenceApi, type ReferenceItem } from '../api/reference';

type Props = StackScreenProps<RootStackParamList, 'Marketplace'>;

const FILTERS_STORAGE_KEY = 'marketplace.filters';

/** Number of filters that narrow the result set (search text excluded). */
export function countActiveFilters(filters: ListingFilters): number {
  return [
    filters.commodity,
    filters.region,
    filters.minPrice !== undefined ? 1 : undefined,
    filters.maxPrice !== undefined ? 1 : undefined,
    filters.minQuantity !== undefined ? 1 : undefined,
    filters.maxQuantity !== undefined ? 1 : undefined,
  ].filter(Boolean).length;
}

function parseAmount(text: string): number | undefined {
  const n = parseFloat(text);
  return text.trim() !== '' && !isNaN(n) && n >= 0 ? n : undefined;
}

function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`listing-card-${listing.id}`}
    >
      <View style={styles.cardRow}>
        <Text style={styles.commodity}>{listing.commodity}</Text>
        <Text style={styles.price}>NGN {Number(listing.pricePerUnit).toLocaleString()}/{listing.unit}</Text>
      </View>
      <Text style={styles.meta}>
        {listing.quantity} {listing.unit} available · {listing.region}
      </Text>
    </TouchableOpacity>
  );
}

function FiltersSheet({
  visible,
  filters,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: ListingFilters;
  onApply: (next: ListingFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ListingFilters>(filters);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [minQtyText, setMinQtyText] = useState('');
  const [maxQtyText, setMaxQtyText] = useState('');
  const [commodities, setCommodities] = useState<ReferenceItem[]>(FALLBACK_COMMODITIES);
  const [regions, setRegions] = useState<ReferenceItem[]>([]);

  // Re-sync the draft each time the sheet opens so Cancel discards edits.
  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setMinText(filters.minPrice !== undefined ? String(filters.minPrice) : '');
      setMaxText(filters.maxPrice !== undefined ? String(filters.maxPrice) : '');
      setMinQtyText(filters.minQuantity !== undefined ? String(filters.minQuantity) : '');
      setMaxQtyText(filters.maxQuantity !== undefined ? String(filters.maxQuantity) : '');
    }
  }, [visible, filters]);

  useEffect(() => {
    let cancelled = false;
    referenceApi.listCommodities().then((c) => !cancelled && c.length && setCommodities(c)).catch(() => {});
    referenceApi.listRegions().then((r) => !cancelled && setRegions(r)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const min = parseAmount(minText);
  const max = parseAmount(maxText);
  const minQty = parseAmount(minQtyText);
  const maxQty = parseAmount(maxQtyText);
  const rangeInvalid =
    (min !== undefined && max !== undefined && min > max) ||
    (minQty !== undefined && maxQty !== undefined && minQty > maxQty);

  const toggle = (key: 'commodity' | 'region', code: string) =>
    setDraft((d) => ({ ...d, [key]: d[key] === code ? undefined : code }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet} testID="filters-sheet">
          <Text style={styles.sheetTitle}>Filters</Text>
          <ScrollView>
            <Text style={styles.label}>Commodity</Text>
            <View style={styles.chipRow}>
              {commodities.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.chip, draft.commodity === c.code && styles.chipActive]}
                  onPress={() => toggle('commodity', c.code)}
                  testID={`filter-commodity-${c.code}`}
                >
                  <Text style={[styles.chipText, draft.commodity === c.code && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {regions.length > 0 && (
              <>
                <Text style={styles.label}>Region</Text>
                <View style={styles.chipRow}>
                  {regions.map((r) => (
                    <TouchableOpacity
                      key={r.code}
                      style={[styles.chip, draft.region === r.code && styles.chipActive]}
                      onPress={() => toggle('region', r.code)}
                      testID={`filter-region-${r.code}`}
                    >
                      <Text style={[styles.chipText, draft.region === r.code && styles.chipTextActive]}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Price per unit (NGN)</Text>
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Min"
                keyboardType="numeric"
                value={minText}
                onChangeText={setMinText}
                testID="filter-min-price"
              />
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Max"
                keyboardType="numeric"
                value={maxText}
                onChangeText={setMaxText}
                testID="filter-max-price"
              />
            </View>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Min"
                keyboardType="numeric"
                value={minQtyText}
                onChangeText={setMinQtyText}
                testID="filter-min-quantity"
              />
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Max"
                keyboardType="numeric"
                value={maxQtyText}
                onChangeText={setMaxQtyText}
                testID="filter-max-quantity"
              />
            </View>
            {rangeInvalid && <Text style={styles.error}>Minimum must not exceed maximum.</Text>}
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              onPress={() => {
                setDraft({ q: filters.q });
                setMinText('');
                setMaxText('');
                setMinQtyText('');
                setMaxQtyText('');
              }}
              testID="filters-reset"
            >
              <Text style={styles.link}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} testID="filters-cancel">
              <Text style={styles.link}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, rangeInvalid && styles.applyBtnDisabled]}
              disabled={rangeInvalid}
              onPress={() =>
                onApply({ ...draft, minPrice: min, maxPrice: max, minQuantity: minQty, maxQuantity: maxQty })
              }
              testID="filters-apply"
            >
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MarketplaceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<ListingFilters>({});
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { listings, isLoading, isRefreshing, isLoadingMore, error, refresh, loadMore } = useListings(filters);

  // Debounce free-text search so each keystroke does not hit the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === (search.trim() || undefined) ? f : { ...f, q: search.trim() || undefined }));
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Restore saved filters on mount; saving waits until restore finishes so the empty
  // initial state cannot overwrite them. Promise.resolve() turns a synchronous
  // native-module throw into a handled rejection.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve()
      .then(() => AsyncStorage.getItem(FILTERS_STORAGE_KEY))
      .then((raw) => {
        if (raw) setFilters(JSON.parse(raw) ?? {});
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Search text is transient, so only structured filters are persisted.
    const saved = { ...filters, q: undefined };
    Promise.resolve()
      .then(() => AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(saved)))
      .catch(() => {});
  }, [filters, hydrated]);

  const openListing = useCallback(
    (listing: Listing) => navigation.navigate('ListingDetail', { listingId: listing.id }),
    [navigation],
  );

  const activeCount = countActiveFilters(filters);

  const removeFilters = (keys: (keyof ListingFilters)[]) =>
    setFilters((f) => {
      const next = { ...f };
      for (const k of keys) delete next[k];
      return next;
    });

  const chips: { id: string; label: string; keys: (keyof ListingFilters)[] }[] = [];
  if (filters.commodity) chips.push({ id: 'commodity', label: `Commodity: ${filters.commodity}`, keys: ['commodity'] });
  if (filters.region) chips.push({ id: 'region', label: `Region: ${filters.region}`, keys: ['region'] });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined)
    chips.push({
      id: 'price',
      label: `Price: ${filters.minPrice ?? 0}–${filters.maxPrice ?? '∞'}`,
      keys: ['minPrice', 'maxPrice'],
    });
  if (filters.minQuantity !== undefined || filters.maxQuantity !== undefined)
    chips.push({
      id: 'quantity',
      label: `Quantity: ${filters.minQuantity ?? 0}–${filters.maxQuantity ?? '∞'}`,
      keys: ['minQuantity', 'maxQuantity'],
    });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('CreateListing')} testID="open-create-listing">
            <Text style={styles.link}>+ Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSheetOpen(true)} testID="open-filters">
            <Text style={styles.link}>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[styles.input, styles.search]}
        placeholder="Search listings"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        testID="marketplace-search"
      />

      {chips.length > 0 && (
        <View style={styles.chipBar}>
          {chips.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, styles.chipActive]}
              onPress={() => removeFilters(c.keys)}
              testID={`active-filter-${c.id}`}
            >
              <Text style={styles.chipTextActive}>{c.label} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && listings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={refresh} testID="marketplace-retry">
            <Text style={styles.link}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <ActivityIndicator style={styles.center} color="#2d6a2d" testID="marketplace-loading" />
      ) : (
        <FlatList
          testID="marketplace-list"
          data={listings}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <ListingCard listing={item} onPress={() => openListing(item)} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Text style={styles.empty}>No listings match your filters.</Text>}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#2d6a2d" testID="marketplace-loading-more" /> : null}
        />
      )}

      <FiltersSheet
        visible={sheetOpen}
        filters={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a3a1a' },
  link: { color: '#2d6a2d', fontWeight: '600' },
  search: { marginHorizontal: 16, marginBottom: 8 },
  chipBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d0dcd0', borderRadius: 8, padding: 10 },
  listContent: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commodity: { fontSize: 16, fontWeight: '700', color: '#1a3a1a' },
  price: { fontSize: 14, fontWeight: '600', color: '#2d6a2d' },
  meta: { marginTop: 6, color: '#667' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#667', marginTop: 40 },
  error: { color: '#EF4444', marginVertical: 8 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '80%' },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e0e8e0' },
  chipActive: { backgroundColor: '#2d6a2d' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  priceInput: { flex: 1, marginRight: 8 },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  applyBtn: { backgroundColor: '#2d6a2d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  applyBtnDisabled: { opacity: 0.4 },
  applyText: { color: '#fff', fontWeight: '700' },
});
