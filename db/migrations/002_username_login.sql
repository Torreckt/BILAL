-- Sign-in is by a username the owner creates for each employee, with a password. No authenticator app.
alter table users rename column email to username;
alter table users drop column totp_secret, drop column totp_enabled, drop column totp_last_step;
alter table sessions drop column mfa_ok;
