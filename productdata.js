ProductData = new Mongo.Collection('productData');
Ingredients = new Mongo.Collection('productIngredients');
Packaging = new Mongo.Collection('productPackaging');
Trash = new Mongo.Collection('trash');

if (Meteor.isClient) {
  // counter starts at 0

	Meteor.subscribe('productData');
	Meteor.subscribe('ingredients');
	Meteor.subscribe('packaging');

	Template.form.helpers({
		'formElements': function(){
			var value = Session.get('navArea');
			return Session.get(value);
		},
		'setTitle': function(){
			return Session.get('navMenu');
		},
		'getValue': function(){
			var dataStore = Session.get('navStorage');
			var prdData=Session.get(dataStore);
			
			return prdData[this.value];
		}
	});

	Template.form.events({
		'blur .formData': function(event){
			var dataStore = Session.get('navStorage');
			var prdData=Session.get(dataStore);
			var formItem=this.value;
			var formValue=event.currentTarget.value;
			
			prdData[formItem]=formValue;
			Session.set(dataStore, prdData);
		},
		'click .postData': function(){
			var dataStore = Session.get('navStorage');

			console.log(Session.get(dataStore));
			if (dataStore == 'dataPRD') {
				Meteor.call('upsertProduct', Session.get('recID'), Session.get(dataStore), function(error, result){
						Session.set('prdID', result['insertedId']);
						Session.set('recID', result['insertedId']);
					});
				Session.set(dataStore,{});
			} 
			else if (dataStore == 'dataING') {
				var data = Session.get(dataStore);
				data['prdID']=Session.get('prdID');
				
				Meteor.call('upsertIngredients', Session.get('recID'), data);
			} else if (dataStore == 'dataPCK') {
				var data = Session.get(dataStore);
				data['prdID']=Session.get('prdID');
				
				Meteor.call('upsertPackaging', Session.get('recID'), data);
			} else {
				var data = Session.get(dataStore);
				data['prdID']=Session.get('prdID');
				data['recID']=Session.get('recID');
				Trash.insert(data);
			}
			
		},
		'click .reset': function(){
			var dataStore = Session.get('navStorage');
			Session.set(dataStore,{});
		}
	});
	
	Template.navigation.helpers({
		'navli': function(){
			return Session.get('navList');
		} ,
		'navActive': function(){
			if (Session.get('navArea')==this.value){
				return "active"
			}
		}

	});

  Template.navigation.events({
		'click .navli': function (){
			if (Session.get('prdID')) {
				Session.set('navArea', this.value);
				Session.set('navMenu', this.menu);
				Session.set('navStorage', this.dataStore);
				Session.set(this.dataStore, {});
				Session.set('recID', '');
				if (Session.get('navArea')=='PRD') {
					Session.set('prdID','');
				}
			}
		}
	});
	
	Template.navigation.rendered = function() {
		Session.setDefault('navList', [
			{menu: "Product Info", value: "PRD", dataStore:"dataPRD"},
			{menu: "Ingredients", value: "ING", dataStore:"dataING"},
			{menu: "Packaging", value: "PCK", dataStore:"dataPCK"}
		]);
		Session.set('navArea', 'PRD');
		Session.set('navMenu', 'Product Info');
		Session.set('navStorage', 'dataPRD');
		Session.set('recID', '');
		Session.set('dataPRD',{});
		Session.set('PRD', [
			{item: "Name", value:"prdName"},
			{item: "Form", value:"prdForm"},
			{item: "Origin", value:"prdOrigin"},
			{item: "Segment", value:"prdSegment"},
			{item: "Shelf Life", value:"prdShelflife"}
		]);
		Session.set('ING', [
			{item:"Type", value:"ingType"},
			{item: "Origin", value:"ingOrigin"},
			{item:"Description", value:"ingDesc"},
			{item:"Specification", value:"ingSpec"},
			{item:"Proportion", value:"ingProp"},
		]);
		Session.set('PCK', [
			{item:"Type", value:"pckType"},
			{item:"Size", value:"pckSize"},
			{item:"Unit", value:"pckUnit"},
			{item:"Price", value:"pckPrice"},
		]);
	};
	
	Template.productList.helpers({
		'records': function(){
			return ProductData.find();
		},
		'active': function(){
			if(Session.get('prdID')==this._id) {
				return "Selected";
			}
		}
	});
	
	Template.productList.events({
		'click .product': function(){
			Session.set('prdID', this._id);
			Session.set('recID', this._id);
			var data = ProductData.findOne(this._id);
			Session.set('dataPRD', data);
		},
		'click .delete': function(){
			Meteor.call('deleteProduct', this._id);
			Meteor.call('deleteIngredient', this._id);
			Meteor.call('deletePackaging', this._id);
		}
	});
	
	Template.ingredientList.helpers({
		'records': function(){
			return Ingredients.find({prdID:Session.get('prdID')});
		},
		'active': function(){
			if(Session.get('recID')==this._id) {
				return "Selected";
			}
		}
	});
	
	Template.ingredientList.events({
		'click .ingredient': function(){
			Session.set('recID', this._id);
			var data = Ingredients.findOne(this._id);
			Session.set('dataING', data);
		},
		'click .delete': function(){
			Meteor.call('deleteIngredient', this._id);
		}
	});
	
	Template.packagingList.helpers({
		'records': function(){
			return Packaging.find({prdID:Session.get('prdID')});
		},
		'active': function(){
			if(Session.get('recID')==this._id) {
				return "Selected";
			}
		}
	});
	
	Template.packagingList.events({
		'click .package': function(){
			Session.set('recID', this._id);
			var data = Packaging.findOne(this._id);
			Session.set('dataPCK', data);
		},
		'click .delete': function(){
			Meteor.call('deletePackaging', this._id);
		}
	});
	
	UI.body.helpers({
		'showTemplate': function(value){
			if (Session.get('navArea')==value){
				return true;			
			} else {
				return false;
			}
		}
	});
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
	Meteor.publish('productData', function(){
		return ProductData.find();
	});
	
	Meteor.publish('ingredients', function(){
		return Ingredients.find();
	});
	
	Meteor.publish('packaging', function(){
		return Packaging.find();
	});
	
	Meteor.methods({
		'upsertProduct': function(refId, data){
			return ProductData.upsert(refId, data);
		},
		'upsertIngredients':function(refId, data){
			return Ingredients.upsert(refId, data);
		},
		'upsertPackaging':function(refId, data){
			return Packaging.upsert(refId, data);
		},
		'deleteProduct': function(refId){
			return ProductData.remove({_id:refId});
		},
		'deletePackaging': function(refId){
			return Packaging.remove({$or:[{_id:refId},{prdID:refId}]});
		},
		'deleteIngredient': function(refId){
			return Ingredients.remove({$or:[{_id:refId},{prdID:refId}]});
		}
	});
}
