import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

export enum CollectionIndexOptionsCollationLocale {
  Afrikaans = 'af',
  Albanian = 'sq',
  Amharic = 'am',
  Arabic = 'ar',
  Armenian = 'hy',
  Assamese = 'as',
  Azeri = 'az',
  Belarusian = 'be',
  Bengali = 'bn',
  Bosnian = 'bs',
  Bulgarian = 'bg',
  Burmese = 'my',
  Catalan = 'ca',
  Cherokee = 'chr',
  Chinese = 'zh',
  Croatian = 'hr',
  Czech = 'cs',
  Danish = 'da',
  Dutch = 'nl',
  Dzongkha = 'dz',
  English = 'en',
  Esperanto = 'eo',
  Estonian = 'et',
  Ewe = 'ee',
  Faroese = 'fo',
  Filipino = 'fil',
  Finnish = 'fi',
  French = 'fr',
  Galician = 'gl',
  Georgian = 'ka',
  German = 'de',
  Greek = 'el',
  Gujarati = 'gu',
  Hausa = 'ha',
  Hawaiian = 'haw',
  Hebrew = 'he',
  Hindi = 'hi',
  Hungarian = 'hu',
  Icelandic = 'is',
  Igbo = 'ig',
  InariSami = 'smn',
  Indonesian = 'id',
  Irish = 'ga',
  Italian = 'it',
  Japanese = 'ja',
  Kalaallisut = 'kl',
  Kannada = 'kn',
  Kazakh = 'kk',
  Khmer = 'km',
  Konkani = 'kok',
  Korean = 'ko',
  Kyrgyz = 'ky',
  Lakota = 'lkt',
  Lao = 'lo',
  Latvian = 'lv',
  Lingala = 'ln',
  Lithuanian = 'lt',
  LowerSorbian = 'dsb',
  Luxembourgish = 'lb',
  Macedonian = 'mk',
  Malay = 'ms',
  Malayalam = 'ml',
  Maltese = 'mt',
  Marathi = 'mr',
  Mongolian = 'mn',
  Nepali = 'ne',
  NorthernSami = 'se',
  NorwegianBokmål = 'nb',
  NorwegianNynorsk = 'nn',
  Oriya = 'or',
  Oromo = 'om',
  Pashto = 'ps',
  Persian = 'fa',
  Polish = 'pl',
  Portuguese = 'pt',
  Punjabi = 'pa',
  Romanian = 'ro',
  Russian = 'ru',
  Serbian = 'sr',
  Sinhala = 'si',
  Slovak = 'sk',
  Slovenian = 'sl',
  Spanish = 'es',
  Swahili = 'sw',
  Swedish = 'sv',
  Tamil = 'ta',
  Telugu = 'te',
  Thai = 'th',
  Tibetan = 'bo',
  Tongan = 'to',
  Turkish = 'tr',
  Ukrainian = 'uk',
  UpperSorbian = 'hsb',
  Urdu = 'ur',
  Uyghur = 'ug',
  Vietnamese = 'vi',
  Walser = 'wae',
  Welsh = 'cy',
  Yiddish = 'yi',
  Yoruba = 'yo',
  Zulu = 'zu',
}

@modelOptions({ schemaOptions: { _id: false } })
export class CollectionIndexOptionsCollationSchema {
  @prop({ enum: CollectionIndexOptionsCollationLocale, required: true, type: String })
  public locale: CollectionIndexOptionsCollationLocale;

  @prop({ max: 5, min: 1, required: true, type: Number })
  public strength: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionIndexOptionsCollationModel,
    values: Partial<CollectionIndexOptionsCollationSchema> = {},
  ) {
    const defaults = { locale: CollectionIndexOptionsCollationLocale.English, strength: 1 };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexOptionsCollationDocument =
  DocumentType<CollectionIndexOptionsCollationSchema>;
export const CollectionIndexOptionsCollationModel = getModelForClass(
  CollectionIndexOptionsCollationSchema,
);
