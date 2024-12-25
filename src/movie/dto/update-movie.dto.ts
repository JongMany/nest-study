import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  // registerDecorator,
  // Validate,
  // ValidationArguments,
  // ValidationOptions,
  // ValidatorConstraint,
  // ValidatorConstraintInterface,
} from 'class-validator';

// @ValidatorConstraint()
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(
//     value: any,
//     validationArguments?: ValidationArguments,
//   ): Promise<boolean> | boolean {
//     return value.length > 4 && value.length < 8;
//   }
//   defaultMessage(validationArguments?: ValidationArguments): string {
//     return '비밀번호의 길이는 4~8자여야 합니다. 입력된 비밀번호 ($value)';
//   }
// }

// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator,
//     });
//   };
// }

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  genre?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  detail?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  directorId?: number;

  // @Validate(PasswordValidator)
  // @IsPasswordValid()
  // test: string;
}
