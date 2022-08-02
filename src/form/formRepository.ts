import RequiredValidator from './validators/requiredValidator';
import LengthValidator from './validators/lengthValidator';
import PasswordValidator from './validators/passwordValidator';
import PhoneValidator from './validators/phoneValidator';
import SystemNameValidator from './validators/systemNameValidator';
import EmailValidator from './validators/emailValidator';
import CodeValidation from './validators/codeValidation';
import RegExpValidator from './validators/regExpValidator';
import LoginValidator from './validators/loginValidator';
import Http from './validators/httpValidator';
import Https from './validators/httpsValidator';
import Telegram from './validators/tgValidator';
import MailTo from './validators/mailtoValidator';
import Ftp from './validators/ftpValidator';
import Ftps from './validators/ftpsValidator';
import Git from './validators/gitValidator';
import Ssh from './validators/sshValidator';

export default {
    editors: {},
    validators: {
        required: RequiredValidator,
        length: LengthValidator,
        password: PasswordValidator,
        phone: PhoneValidator,
        systemName: SystemNameValidator,
        email: EmailValidator,
        code: CodeValidation,
        regexp: RegExpValidator,
        login: LoginValidator,
        http: Http,
        https: Https,
        telegram: Telegram,
        mailto: MailTo,
        git: Git,
        ssh: Ssh,
        ftp: Ftp,
        ftps: Ftps
    },
    getValidator(validator: string | Function) {
        const validators = this.validators;

        //Convert regular expressions to validators
        if (_.isRegExp(validator)) {
            return validators.regexp({ regexp: validator });
        }

        //Use a built-in validator if given a string
        if (typeof validator === 'string') {
            if (!validators[validator]) {
                throw new Error(`Validator "${validator}" not found`);
            }

            return validators[validator]();
        }

        //Functions can be used directly
        if (typeof validator === 'function') {
            return validator;
        }

        //Use a customised built-in validator if given an object
        //noinspection JSUnresolvedVariable
        if (_.isObject(validator) && validator.type) {
            const config = validator;

            //noinspection JSUnresolvedVariable
            return validators[config.type](config);
        }

        //Unknown validator type
        throw new Error('Invalid validator');
    }
};
