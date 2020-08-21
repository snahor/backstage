/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, useState } from 'react';
import { CatalogPage } from './components/CatalogPage/CatalogPage';
// import { EntityPage } from './components/EntityPage/EntityPage';
import { Route, Routes, useParams, useNavigate } from 'react-router';
import { entityRoute, rootRoute, entityRouteDefault } from './routes';
import { useEntityFromUrl, EntityContext, useEntity } from './hooks/useEntity';
import {
  pageTheme,
  PageTheme,
  Page,
  Header,
  HeaderLabel,
  Content,
  Progress,
} from '@backstage/core';
import { Entity } from '@backstage/catalog-model';
import { FavouriteEntity } from './components/FavouriteEntity/FavouriteEntity';
import { Box } from '@material-ui/core';
import { EntityContextMenu } from './components/EntityContextMenu/EntityContextMenu';
import { UnregisterEntityDialog } from './components/UnregisterEntityDialog/UnregisterEntityDialog';
import { Alert } from '@material-ui/lab';
// const EntityContext = React.createContext(null);
export const getPageTheme = (entity?: Entity): PageTheme => {
  const themeKey = entity?.spec?.type?.toString() ?? 'home';
  return pageTheme[themeKey] ?? pageTheme.home;
};

const EntityPageTitle = ({
  entity,
  title,
}: {
  title: string;
  entity: Entity | undefined;
}) => (
  <Box display="inline-flex" alignItems="center" height="1em">
    {title}
    {entity && <FavouriteEntity entity={entity} />}
  </Box>
);

function headerProps(
  kind: string,
  namespace: string | undefined,
  name: string,
  entity: Entity | undefined,
): { headerTitle: string; headerType: string } {
  return {
    headerTitle: `${name}${namespace ? ` in ${namespace}` : ''}`,
    headerType: (() => {
      let t = kind.toLowerCase();
      if (entity && entity.spec && 'type' in entity.spec) {
        t += ' — ';
        t += (entity.spec as { type: string }).type.toLowerCase();
      }
      return t;
    })(),
  };
}
const EntityPageLayout = ({ children }: { children: React.ReactNode }) => {
  const { entity, loading, error } = useEntityFromUrl();
  const { optionalNamespaceAndName, kind } = useParams() as {
    optionalNamespaceAndName: string;
    kind: string;
  };
  const [name, namespace] = optionalNamespaceAndName.split(':').reverse();

  const { headerTitle, headerType } = headerProps(
    kind,
    namespace,
    name,
    entity!,
  );

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const navigate = useNavigate();
  const cleanUpAfterRemoval = async () => {
    setConfirmationDialogOpen(false);
    navigate('/');
  };

  const showRemovalDialog = () => setConfirmationDialogOpen(true);

  return (
    <Page theme={getPageTheme(entity!)}>
      <Header
        title={<EntityPageTitle title={headerTitle} entity={entity!} />}
        pageTitleOverride={headerTitle}
        type={headerType}
      >
        {entity && (
          <>
            <HeaderLabel
              label="Owner"
              value={entity.spec?.owner || 'unknown'}
            />
            <HeaderLabel
              label="Lifecycle"
              value={entity.spec?.lifecycle || 'unknown'}
            />
            <EntityContextMenu onUnregisterEntity={showRemovalDialog} />
          </>
        )}
      </Header>

      {loading && <Progress />}

      {entity && (
        <EntityContext.Provider value={entity}>
          {children}
        </EntityContext.Provider>
      )}
      {error && (
        <Content>
          <Alert severity="error">{error.toString()}</Alert>
        </Content>
      )}
      <UnregisterEntityDialog
        open={confirmationDialogOpen}
        entity={entity!}
        onConfirm={cleanUpAfterRemoval}
        onClose={() => setConfirmationDialogOpen(false)}
      />
    </Page>
  );
};

export const CatalogPlugin = ({ EntityPage }) => (
  <Routes>
    <Route path={`/${rootRoute.path}`} element={<CatalogPage />} />
    <Route
      path={`/${entityRoute.path}`}
      element={
        <EntityPageLayout>
          <EntityPage />
        </EntityPageLayout>
      }
    />
    <Route
      path={`/${entityRouteDefault.path}`}
      element={
        <EntityPageLayout>
          <EntityPage />
        </EntityPageLayout>
      }
    />
  </Routes>
);

export { EntityMetadataCard } from './components/EntityMetadataCard/EntityMetadataCard';