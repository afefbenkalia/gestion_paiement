'use client';
//src/components/session-assignment-swipe.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User, Users, Check, Download } from 'lucide-react';

// =============================
//  Carousel (copié conforme de page.jsx)
// =============================
function Carousel({ items = [], renderItem, maxVisible = 3, perPage }) {
  const [page, setPage] = React.useState(0);
  const initialVisible = perPage ?? maxVisible;
  const [visible, setVisible] = React.useState(initialVisible);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (perPage !== undefined) {
      setVisible(perPage);
      setPage(0);
      return;
    }

    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setVisible(1);
      else if (w < 1024) setVisible(2);
      else setVisible(maxVisible);
      setPage(0);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [maxVisible, perPage]);

  const pages = Math.max(1, Math.ceil(items.length / visible));

  React.useEffect(() => {
    if (page >= pages) setPage(0);
  }, [pages, page]);

  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(p + 1, pages - 1));

  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden" ref={containerRef}>
          {/**
           * Ensure full-width usage even when items < visible.
           * If fewer items than the configured visible count, stretch them across 100%.
           */}
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              width: `${items.length === 0 ? 100 : (items.length < visible ? 100 : (items.length / visible) * 100)}%`,
              transform: `translateX(-${page * 100}%)`
            }}
          >
            {items.map((it, idx) => {
              const basis = items.length < visible ? 100 / items.length : 100 / visible;
              return (
                <div key={it.id ?? idx} style={{ flex: `0 0 ${basis}%` }} className="px-2">
                  {renderItem(it, idx)}
                </div>
              );
            })}
          </div>
        </div>

            {pages > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-lg text-3xl font-bold text-gray-700 hover:text-gray-900 transition-all hidden md:block"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-lg text-3xl font-bold text-gray-700 hover:text-gray-900 transition-all hidden md:block"
                >
                  ›
                </button>
              </>
            )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setPage(i)}
              className={`w-3 h-3 rounded-full ${i === page ? 'bg-gray-800' : 'bg-gray-300'}`}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================
//  CoordinateurSwipe
// =============================
export function CoordinateurSwipe({ coordinateurs, selectedId, onSelect }) {
  // Filtrer pour exclure le coordinateur sélectionné de la liste disponible
  const availableCoordinateurs = coordinateurs.filter(c => String(c.id) !== String(selectedId));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Coordinateurs Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {availableCoordinateurs?.length > 0 ? (
              <Carousel
                items={availableCoordinateurs}
                maxVisible={4}
                perPage={4}
                renderItem={(c) => (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-400 to-purple-500 text-white rounded-full text-2xl font-bold">
                        {c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <h3 className="font-semibold text-base">{c.name}</h3>
                      <p className="text-sm text-blue-600 flex items-center justify-center gap-1">
                        <Mail className="h-3 w-3" />{c.email}
                      </p>
                      {c.tel && (
                        <p className="text-sm text-blue-600 flex items-center justify-center gap-1">
                          <Phone className="h-3 w-3" />{c.tel}
                        </p>
                      )}
                      <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 w-full text-white py-2 text-base"
                        onClick={() => onSelect(String(c.id))}
                      >
                        Assigner
                      </Button>
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucun coordinateur disponible</p>
              </div>
            )}
      </CardContent>
    </Card>
  );
}

// =============================
//  FormateursSwipe
// =============================
export function FormateursSwipe({ formateurs, selectedIds, onToggle }) {
  const orderedFormateurs = React.useMemo(() => {
    if (!formateurs) return [];
    const assigned = formateurs.filter((f) => selectedIds.includes(String(f.id)));
    const others = formateurs.filter((f) => !selectedIds.includes(String(f.id)));
    return [...assigned, ...others];
  }, [formateurs, selectedIds]);

  const handleDownloadCV = (formateurId) => {
    window.open(`/api/users/${formateurId}/cv`, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Formateurs Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formateurs?.length > 0 ? (
          <Carousel
            items={orderedFormateurs}
            maxVisible={5}
            perPage={5}
            renderItem={(f) => {
              const isAssigned = selectedIds.includes(String(f.id));
              return (
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Badge variant="secondary" className={isAssigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {isAssigned ? 'Assigné' : 'Disponible'}
                    </Badge>
                    <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-400 to-orange-600 text-white rounded-full text-2xl font-bold">
                      {f.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <h3 className="font-semibold text-base">{f.name}</h3>
                    <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                      <Mail className="h-3 w-3" />{f.email}
                    </p>
                    {f.tel && (
                      <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3" />{f.tel}
                      </p>
                    )}
                    <Button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 w-full text-white py-2 text-base"
                      onClick={() => handleDownloadCV(f.id)}
                    >
                      <Download className="h-3 w-3 mr-1" /> CV
                    </Button>
                    {isAssigned ? (
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full py-2 text-base"
                        onClick={() => onToggle(String(f.id))}
                      >
                        Retirer
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="bg-green-500 hover:bg-green-600 w-full text-white py-2 text-base"
                        onClick={() => onToggle(String(f.id))}
                      >
                        <Check className="h-3 w-3 mr-1" /> Assigner
                      </Button>
                    )}
                  </div>
                </div>
              );
            }}
          />
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucun formateur disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
