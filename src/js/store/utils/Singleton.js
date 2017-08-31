// // USING:
// // Module.js
// import Singleton from './Singleton';
// export default Singleton(() => {
// 	// logic...
// 	return new YourClass.apply(this, arguments);
// });
//
// // app.js
// import Module from './Module';
// const obj = Module.inst();
//
// // other.js
// import Module from './Module';
// const obj = Module.inst();

// Singleton.js
export const Singleton = (callBackObjectCreate) => {
	return (function() {
		let instance = undefined;

		function createInstance() {
			instance = callBackObjectCreate();
		}

		return {
			inst: function() {
				if (!instance) {
					createInstance();
				}
				return instance;
			}
		};
	})();
};