import {
  ArrayVector,
  DataTransformerConfig,
  DataTransformerID,
  FieldType,
  toDataFrame,
  transformDataFrame,
} from '@grafana/data';
import { OrganizeFieldsTransformerOptions } from './organize';

describe('OrganizeFields Transformer', () => {
  describe('when consistent data is received', () => {
    const data = toDataFrame({
      name: 'A',
      fields: [
        { name: 'time', type: FieldType.time, values: [3000, 4000, 5000, 6000] },
        { name: 'temperature', type: FieldType.number, values: [10.3, 10.4, 10.5, 10.6] },
        { name: 'humidity', type: FieldType.number, values: [10000.3, 10000.4, 10000.5, 10000.6] },
      ],
    });

    it('should order and filter according to config', () => {
      const cfg: DataTransformerConfig<OrganizeFieldsTransformerOptions> = {
        id: DataTransformerID.organize,
        options: {
          indexByName: {
            time: 2,
            temperature: 0,
            humidity: 1,
          },
          excludeByName: {
            time: true,
          },
          renameByName: {
            humidity: 'renamed_humidity',
          },
        },
      };

      const organized = transformDataFrame([cfg], [data])[0];

      expect(organized.fields).toEqual([
        {
          config: {},
          name: 'temperature',
          type: FieldType.number,
          values: new ArrayVector([10.3, 10.4, 10.5, 10.6]),
        },
        {
          config: {},
          name: 'renamed_humidity',
          type: FieldType.number,
          values: new ArrayVector([10000.3, 10000.4, 10000.5, 10000.6]),
        },
      ]);
    });
  });

  describe('when inconsistent data is received', () => {
    const data = toDataFrame({
      name: 'A',
      fields: [
        { name: 'time', type: FieldType.time, values: [3000, 4000, 5000, 6000] },
        { name: 'pressure', type: FieldType.number, values: [10.3, 10.4, 10.5, 10.6] },
        { name: 'humidity', type: FieldType.number, values: [10000.3, 10000.4, 10000.5, 10000.6] },
      ],
    });

    it('should append fields missing in config at the end', () => {
      const cfg: DataTransformerConfig<OrganizeFieldsTransformerOptions> = {
        id: DataTransformerID.organize,
        options: {
          indexByName: {
            time: 2,
            temperature: 0,
            humidity: 1,
          },
          excludeByName: {
            humidity: true,
          },
          renameByName: {
            time: 'renamed_time',
          },
        },
      };

      const organized = transformDataFrame([cfg], [data])[0];

      expect(organized.fields).toEqual([
        {
          config: {},
          name: 'renamed_time',
          type: FieldType.time,
          values: new ArrayVector([3000, 4000, 5000, 6000]),
        },
        {
          config: {},
          name: 'pressure',
          type: FieldType.number,
          values: new ArrayVector([10.3, 10.4, 10.5, 10.6]),
        },
      ]);
    });
  });
});
