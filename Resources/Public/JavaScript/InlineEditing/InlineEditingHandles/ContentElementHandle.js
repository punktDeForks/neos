/**
 */
define(
	[
		'Library/jquery-with-dependencies',
		'Library/underscore',
		'emberjs',
		'vie/instance',
		'text!InlineEditing/InlineEditingHandles/ContentElementHandle.html',
		'Content/Application',
		'Content/Inspector/InspectorController',
		'InlineEditing/Dialogs/DeleteNodeDialog',
		'InlineEditing/InsertNodePanel'
	],
	function ($, _, Ember, vieInstance, template, Application, InspectorController, DeleteNodeDialog, InsertNodePanel) {

		return Ember.View.extend({
			template: Ember.Handlebars.compile(template),

			_entity: null,
			_nodePath: null,
			_selectedNode: null,

			$newAfterPopoverContent: null,

			_onNodeSelectionChange: function() {
				this.$().find('.action-new').trigger('hidePopover');

				var selectedNode = T3.Content.Model.NodeSelection.get('selectedNode');

				this.set('_selectedNode', selectedNode);
				if (selectedNode) {
					var entity = vieInstance.entities.get(vieInstance.service('rdfa').getElementSubject(selectedNode.$element));
					this.set('_entity', entity);

					entity.on('change', this._entityChanged, this);

					if (entity.has('typo3:_hidden') === true) {
						this.set('_showHide', true);
						this.set('_hidden', entity.get('typo3:_hidden'));
					} else {
						this.set('_showHide', false);
						this.set('_hidden', false);
					}

					this.set('_nodePath', this.get('_entity').getSubjectUri());
				}
			}.observes('T3.Content.Model.NodeSelection.selectedNode'),

			// Button visibility flags
			_showHide: false,
			_showRemove: true,
			_showCut: true,
			_showCopy: true,

			_popoverPosition: 'right',

			/**
			 * Returns the index of the content element in the current section
			 */
			_collectionIndex: function() {
				var entity = this.get('_entity'),
					enclosingCollectionWidget = entity._enclosingCollectionWidget,
					entityIndex = enclosingCollectionWidget.options.collection.indexOf(entity);

				if (entityIndex === -1) {
					entityIndex = enclosingCollectionWidget.options.collection.length;
				} else {
					entityIndex++;
				}
				return entityIndex;
			}.property('_entity'),

			_entityChanged: function() {
				this.set('_hidden', this.get('_entity').get('typo3:_hidden'));
			},

			/** Content element actions **/
			remove: function() {
				DeleteNodeDialog.create({
					_entity: this.get('_entity'),
					_node: this.get('_selectedNode')
				}).appendTo($('#neos-application'));
			},

			newAfter: function() {
				InsertNodePanel.create({
					_entity: this.get('_entity'),
					_node: this.get('_selectedNode'),
					_index: this.get('_collectionIndex')
				}).appendTo($('#neos-application'));
			},

			_hideToggleTitle: function() {
				return this.get('_hidden') === true ? 'Unhide' : 'Hide';
			}.property('_hidden'),

			_thisElementStartedCut: function() {
				var clipboard = T3.Content.Controller.NodeActions.get('_clipboard');
				if (!clipboard) {
					return false;
				}

				return (clipboard.type === 'cut' && clipboard.nodePath === this.get('_nodePath'));
			}.property('T3.Content.Controller.NodeActions._clipboard', '_nodePath'),

			_thisElementStartedCopy: function() {
				var clipboard = T3.Content.Controller.NodeActions.get('_clipboard');
				if (!clipboard) {
					return false;
				}

				return (clipboard.type === 'copy' && clipboard.nodePath === this.get('_nodePath'));
			}.property('T3.Content.Controller.NodeActions._clipboard', '_nodePath'),

			_thisElementIsAddingNewContent: function() {
				var elementIsAddingNewContent = T3.Content.Controller.NodeActions.get('_elementIsAddingNewContent');
				if (!elementIsAddingNewContent) {
					return false;
				}

				return (elementIsAddingNewContent === this.get('_nodePath'));
			}.property('T3.Content.Controller.NodeActions._elementIsAddingNewContent', '_nodePath'),

			_pasteInProgress: false,

			toggleHidden: function() {
				var entity = this.get('_entity'),
					value = !entity.get('typo3:_hidden');
				this.set('_hidden', value);
				entity.set('typo3:_hidden', value);
				InspectorController.set('nodeProperties._hidden', value);
				InspectorController.apply();
			},

			cut: function() {
				T3.Content.Controller.NodeActions.cut(this.get('_nodePath'));
			},

			copy: function() {
				T3.Content.Controller.NodeActions.copy(this.get('_nodePath'));
			},

			pasteAfter: function() {
				if (T3.Content.Controller.NodeActions.pasteAfter(this.get('_nodePath')) === true) {
					this.set('_pasteInProgress', true);
				}
			}
		});
	}
);
