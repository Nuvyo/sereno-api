import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidPrice' })
export class IsValidPriceConstraint implements ValidatorConstraintInterface {

  validate(value: number, _args?: ValidationArguments) {
    if (isNaN(value) || isNaN(Number(value))) {
      return false;
    }

    if (value === null || value === undefined) {
      return false;
    }

    if (value < 0) {
      return false;
    }

    const numberString = value.toString();
    const integerPlaces = numberString.includes('.') ? numberString.split('.')[0].length : numberString.length;
    const decimalPlaces = numberString.includes('.') ? numberString.split('.')[1].length : 0;

    if (integerPlaces > 5) {
      return false;
    }

    if (decimalPlaces > 2) {
      return false;
    }

    return true;
  }

}

export function IsValidPrice(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidPrice',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsValidPriceConstraint,
    });
  };
}
