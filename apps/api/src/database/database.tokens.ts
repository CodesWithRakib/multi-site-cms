/**
 * Injection token for the application `DataSource`.
 *
 * Lives in its own module so consumers (the health probe, future repositories) do
 * not import `database.module`, which imports them. A cycle there would evaluate
 * the token before it is initialised and yield `undefined` at decoration time.
 */
export const DATA_SOURCE = 'DATA_SOURCE';
