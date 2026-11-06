'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PlaceItem {
  id: string;
  name: string;
  description: string | null;
  longitude: number;
  latitude: number;
  userId: string;
  distanceMeters?: number;
  createdAt: string;
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Place form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [longitude, setLongitude] = useState('106.827153');
  const [latitude, setLatitude] = useState('-6.175392');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Proximity Search state
  const [searchLon, setSearchLon] = useState('106.827153');
  const [searchLat, setSearchLat] = useState('-6.175392');
  const [searchRadius, setSearchRadius] = useState('15000'); // 15km
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/places');
      const data = await res.json();
      if (data.success && data.data?.places) {
        setPlaces(data.data.places);
      }
    } catch (err) {
      console.error('Fetch places error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          longitude: Number(longitude),
          latitude: Number(latitude),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data?.error?.message || 'Failed to create place. (Are you signed in?)');
      } else {
        setName('');
        setDescription('');
        fetchPlaces();
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error creating place');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlace = async (id: string) => {
    try {
      const res = await fetch(`/api/places/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error?.message || 'Cannot delete place (Owner authentication required)');
      } else {
        fetchPlaces();
        if (nearbyPlaces) {
          setNearbyPlaces(nearbyPlaces.filter((p) => p.id !== id));
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    }
  };

  const handleNearbySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const query = new URLSearchParams({
        lon: searchLon,
        lat: searchLat,
        radius: searchRadius,
      });

      const res = await fetch(`/api/places/nearby?${query.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNearbyPlaces(data.data);
      }
    } catch (err) {
      console.error('Nearby search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const setMonasPreset = () => {
    setSearchLon('106.827153');
    setSearchLat('-6.175392');
  };

  const setBundaranHiPreset = () => {
    setSearchLon('106.823056');
    setSearchLat('-6.195000');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PostGIS Spatial Places</h1>
        <p className="text-muted-foreground">
          Store geometric coordinates in PostGIS and run spatial proximity queries with <code className="text-xs bg-muted px-1.5 py-0.5 rounded">ST_DWithin</code>.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* PostGIS Nearby Search */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Proximity Search</CardTitle>
              <Badge variant="secondary">PostGIS ST_DWithin</Badge>
            </div>
            <CardDescription>
              Query places within a specified radius (in meters) ordered by distance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleNearbySearch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="searchLon" className="text-xs">Longitude</Label>
                  <Input
                    id="searchLon"
                    value={searchLon}
                    onChange={(e) => setSearchLon(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="searchLat" className="text-xs">Latitude</Label>
                  <Input
                    id="searchLat"
                    value={searchLat}
                    onChange={(e) => setSearchLat(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="radius" className="text-xs">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setMonasPreset}
                  className="text-xs"
                >
                  Preset: Monas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setBundaranHiPreset}
                  className="text-xs"
                >
                  Preset: Bundaran HI
                </Button>
              </div>

              <Button type="submit" disabled={searching} className="w-full">
                {searching ? 'Calculating PostGIS Distance...' : 'Search Nearby Places'}
              </Button>
            </form>

            {nearbyPlaces && (
              <div className="space-y-2 mt-4 pt-4 border-t">
                <h4 className="font-semibold text-sm">
                  Search Results ({nearbyPlaces.length} found)
                </h4>
                {nearbyPlaces.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No places found within {searchRadius} meters.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {nearbyPlaces.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-muted/60 rounded-md text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-muted-foreground">{item.description}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            [{item.longitude}, {item.latitude}]
                          </div>
                        </div>
                        {item.distanceMeters !== undefined && (
                          <Badge variant="outline" className="font-mono">
                            {item.distanceMeters > 1000
                              ? `${(item.distanceMeters / 1000).toFixed(2)} km`
                              : `${item.distanceMeters} m`}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Place */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Add New Spatial Place</CardTitle>
              <Badge variant="outline">Protected Endpoint</Badge>
            </div>
            <CardDescription>
              Requires authentication. Coordinates are stored in SRID 4326.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePlace} className="space-y-3">
              {formError && (
                <div className="p-2.5 text-xs text-destructive bg-destructive/10 rounded-md">
                  {formError}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Place Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Istiqlal Mosque"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="desc" className="text-xs">Description (Optional)</Label>
                <Input
                  id="desc"
                  placeholder="Iconic landmark..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lon" className="text-xs">Longitude (X: -180..180)</Label>
                  <Input
                    id="lon"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lat" className="text-xs">Latitude (Y: -90..90)</Label>
                  <Input
                    id="lat"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? 'Saving...' : 'Save Place to PostGIS'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* All Places List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">All Registered Places</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchPlaces}>
              Refresh
            </Button>
          </div>
          <CardDescription>
            Stored in PostgreSQL with PostGIS GiST index.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading places...</p>
          ) : places.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No places recorded yet. Use the form above to add one, or run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">bun run db:seed</code>.
            </div>
          ) : (
            <div className="divide-y border rounded-md">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{place.name}</div>
                    {place.description && (
                      <div className="text-xs text-muted-foreground">{place.description}</div>
                    )}
                    <div className="text-xs font-mono text-muted-foreground">
                      Coordinates: [{place.longitude}, {place.latitude}]
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePlace(place.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
