import {createSelector} from 'reselect';

const findDialogById = (state, dialogId) => state.Dialogs.dialogs.byId[dialogId] || undefined;

export const getDialogById = createSelector(
	[findDialogById],
	(dialog) => (dialog)
);