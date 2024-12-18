import { Exclude, Expose, Transform } from 'class-transformer';
@Exclude()
export class Movie {
  @Expose()
  id: number;
  @Expose()
  title: string;
  @Expose()
  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;
}
