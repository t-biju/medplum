// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Group, LoadingOverlay, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { createReference, formatHumanName, normalizeErrorString } from '@medplum/core';
import type { Patient, Practitioner } from '@medplum/fhirtypes';
import { ResourceAvatar, ResourceName, useMedplum } from '@medplum/react';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useState } from 'react';
import { InfoSection } from '../../components/InfoSection';

export function Provider(): JSX.Element {
  const medplum = useMedplum();
  const [patient, setPatient] = useState(medplum.getProfile() as Patient);
  const [choosing, setChoosing] = useState(!patient.generalPractitioner?.length);
  const [loading, setLoading] = useState(false);
  const practitioners = medplum.searchResources('Practitioner', '_sort=family').read();

  async function choose(practitioner: Practitioner): Promise<void> {
    setLoading(true);
    try {
      const updated = await medplum.updateResource<Patient>({
        ...patient,
        generalPractitioner: [createReference(practitioner)],
      });
      setPatient(updated);
      setChoosing(false);
      showNotification({
        icon: <IconCircleCheck />,
        title: 'Success',
        message: `${formatHumanName(practitioner.name?.[0] ?? {})} is now your primary care provider`,
      });
    } catch (err) {
      showNotification({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: normalizeErrorString(err),
      });
    }
    setLoading(false);
  }

  if (choosing) {
    return (
      <Box p="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Title mb="lg">Choose a provider</Title>
        <InfoSection title="Available Providers">
          <Stack gap={0}>
            {practitioners.map((practitioner) => (
              <UnstyledButton key={practitioner.id} p="md" onClick={() => choose(practitioner).catch(console.error)}>
                <Group>
                  <ResourceAvatar size={48} radius={24} value={practitioner} />
                  <Text fw={500}>
                    <ResourceName value={practitioner} />
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
            {practitioners.length === 0 && <Box p="xl">No providers available</Box>}
          </Stack>
        </InfoSection>
        {patient.generalPractitioner?.length ? (
          <Button mt="lg" variant="subtle" onClick={() => setChoosing(false)}>
            Cancel
          </Button>
        ) : null}
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Title mb="lg">My Provider</Title>
      <InfoSection title="My Primary Care Provider">
        <Box p="xl">
          <Stack align="center">
            <ResourceAvatar size={200} radius={100} value={patient.generalPractitioner?.[0]} />
            <Title order={2}>
              <ResourceName value={patient.generalPractitioner?.[0]} />
            </Title>
            <Button size="lg" onClick={() => setChoosing(true)}>
              Choose a Primary Care Provider
            </Button>
          </Stack>
        </Box>
      </InfoSection>
    </Box>
  );
}
