import { invoke } from '@tauri-apps/api/core';

const result = await invoke('read_file', {
  input: {
    bucket: 'entity-pages',
    file_path:
      '4986db3b-ce9c-4de1-b63b-d1b68858c08d/entities/place/eac9b435-ec2a-49cb-a133-d4087970f2db.md',
  },
});

console.log('Result:', result);
console.log('Type:', typeof result);
console.log('Keys:', Object.keys(result));
