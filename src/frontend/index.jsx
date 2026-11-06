/**
 * ShipSense — Jira project-page panel (UI Kit / @forge/react).
 * Pick a release, see its Go / Caution / No-Go verdict, score, and the signals behind it.
 */

import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text, Strong, Heading, Lozenge, Stack, Inline, Button, Select, Spinner, Box, List, ListItem, Link,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const VERDICT = {
  GO: { text: 'GO', appearance: 'success' },
  CAUTION: { text: 'CAUTION', appearance: 'moved' },
  NO_GO: { text: 'NO-GO', appearance: 'removed' },
};
const SEV = { block: 'removed', warn: 'moved', info: 'default' };

const App = () => {
  const [project, setProject] = useState(null);
  const [releases, setReleases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    view.getContext()
      .then((ctx) => {
        const p = ctx?.extension?.project ?? ctx?.project ?? {};
        const ref = { projectKey: p.key, projectId: p.id };
        setProject(ref);
        return invoke('listReleases', ref);
      })
      .then((rs) => setReleases(rs ?? []))
      .catch((e) => setError(`Couldn't load releases: ${e?.message ?? e}`));
  }, []);

  const assess = async (versionName) => {
    if (!versionName) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await invoke('getReadiness', { ...(project ?? {}), versionName }));
    } catch (e) {
      setError(`Couldn't assess this release: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const options = releases.map((r) => ({
    label: r.released ? `${r.name} (released)` : r.name,
    value: r.name,
  }));
  const verdict = result && VERDICT[result.verdict];

  return (
    <Stack space="space.200">
      <Heading as="h2">ShipSense — release readiness</Heading>

      {error && (
        <Inline space="space.100" alignBlock="center">
          <Lozenge appearance="removed">error</Lozenge>
          <Text>{error}</Text>
        </Inline>
      )}

      <Inline space="space.100" alignBlock="center">
        <Box xcss={{ minWidth: '260px' }}>
          <Select
            placeholder="Choose a release…"
            options={options}
            onChange={(opt) => { setSelected(opt?.value); assess(opt?.value); }}
          />
        </Box>
        <Button appearance="primary" isDisabled={!selected || loading} onClick={() => assess(selected)}>
          {loading ? 'Assessing…' : 'Re-check'}
        </Button>
      </Inline>

      {loading && <Spinner size="medium" />}

      {verdict && !loading && (
        <Stack space="space.150">
          <Inline space="space.100" alignBlock="center">
            <Lozenge appearance={verdict.appearance}>{verdict.text}</Lozenge>
            <Strong>{result.release?.name ?? selected}</Strong>
            <Text>readiness {result.score}/100 · confidence {result.confidence}</Text>
          </Inline>

          <Text>{result.rationale}</Text>

          {result.twgError && <Text>Teamwork Graph initiatives are unavailable for this site.</Text>}

          {result.signals?.length > 0 && (
            <Stack space="space.100">
              <Strong>What's driving it</Strong>
              {result.signals.map((s, i) => (
                <Stack key={i} space="space.050">
                  <Inline space="space.100" alignBlock="center">
                    <Lozenge appearance={SEV[s.severity] ?? 'default'}>{s.severity}</Lozenge>
                    <Text>{s.label}</Text>
                  </Inline>
                  {s.items?.length > 0 && (
                    <List>
                      {s.items.slice(0, 6).map((it, j) => (
                        <ListItem key={j}>
                          {it.url
                            ? <Link href={it.url} openNewTab>{it.key}</Link>
                            : <Text>{it.key}</Text>}
                          {it.summary ? ` — ${it.summary}` : ''}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Stack>
              ))}
            </Stack>
          )}

          {result.goals?.length > 0 && (
            <Stack space="space.100">
              <Strong>Initiatives this release serves — from Teamwork Graph</Strong>
              {result.goals.slice(0, 6).map((g, i) => (
                <Inline key={i} space="space.100" alignBlock="center">
                  <Lozenge appearance="new">goal</Lozenge>
                  <Text>
                    {g.url ? <Link href={g.url} openNewTab>{g.name}</Link> : g.name}
                    {g.dueDate ? ` · due ${g.dueDate}` : ''}
                  </Text>
                </Inline>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {!result && !loading && !error && <Text>Pick a release to see whether it's ready to ship.</Text>}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
